"""Small, persisted delivery journal for one-use modifiers. No random rolls here."""
import json

class OnceService18:
    def __init__(self, database):
        self.db = database
        self.claims = {}
        if not isinstance(database.get('onceJournal18'), dict):
            database['onceJournal18'] = {}

    def actor(self, character_id, actor_id):
        view = self.db.get('view') or {}
        if view.get('characterId') != character_id:
            return None
        return next((a for a in view.get('actors', []) if a.get('id') == actor_id), None)

    def key(self, job, row):
        return json.dumps([job.get('characterId'), job.get('actorId'), row['key'], row['token']], ensure_ascii=False)

    def prepare(self, payload, job):
        if job.get('type') != 'roll' or not payload.get('once18'):
            return
        actor = self.actor(payload.get('characterId'), payload.get('actorId'))
        if not actor:
            raise ValueError('检定对象已变化，请重新打开检定')
        available = {r['key']: r for r in actor.get('pendingDice18', [])}
        rows = []
        for request in payload.get('once18', [])[:60]:
            row = available.get(request.get('key'))
            if not row or row.get('token') != request.get('token'):
                raise ValueError('待用影响已变化，请重新打开检定')
            if not any(row['key'] == x['key'] for x in rows):
                rows.append(dict(row))
        job.update(characterId=payload['characterId'], actorId=payload['actorId'], once18=rows,
                   baseNotation18=job.get('notation', ''))
        notation = str(job.get('notation', ''))
        for row in rows:
            notation = '(' + notation + ')+(' + row['expression'] + ')'
        if len(notation) > 1000:
            raise ValueError('合并后的公式过长，请减少待用影响')
        job['notation'] = notation

    def confirm(self, payload, job):
        rows = job.get('once18') or []
        selected = set(payload.get('usedOnce18', [r['key'] for r in rows]))
        if payload.get('report'):
            selected = set()
        actor = self.actor(job.get('characterId'), job.get('actorId')) or {}
        available = {r['key']: r for r in actor.get('pendingDice18', [])}
        chosen = [r for r in rows if r['key'] in selected]
        for row in chosen:
            current = available.get(row['key'])
            if not current or current.get('token') != row.get('token'):
                raise ValueError('这项影响已使用或变更，请取消勾选后确认，或重新打开检定')
            for command in self.inbox():
                if command.get('characterId') == job.get('characterId') and any(r['key'] == row['key'] and r['token'] == row['token'] for r in command['rows']):
                    raise ValueError('此影响已经用于已完成检定，等待角色卡同步')
            owner = self.claims.get(self.key(job, row))
            if owner and owner != job['id']:
                raise ValueError('这项影响正用于另一份已确认检定，请等待结果或取消本次使用')
        for row in chosen:
            self.claims[self.key(job, row)] = job['id']
        job['usedOnce18'] = chosen

    def result(self, job, success):
        rows = job.get('usedOnce18') or []
        if not rows:
            return
        if not success:
            for row in rows:
                if self.claims.get(self.key(job, row)) == job['id']:
                    self.claims.pop(self.key(job, row), None)
            return
        journal = self.db['onceJournal18']
        journal[job['id']] = {'id': 'consume18-' + job['id'], 'type': 'consume-dice18',
            'characterId': job['characterId'], 'actorId': job['actorId'],
            'rows': [{'key': r['key'], 'token': r['token']} for r in rows]}

    def inbox(self):
        return list(self.db['onceJournal18'].values())

    def acknowledge(self):
        try:
            raw = json.loads(self.db.get('raw') or '{}')
            characters = {c['id']: c for c in raw.get('characters', [])}
            for key, command in list(self.db['onceJournal18'].items()):
                character = characters.get(command['characterId'], {})
                ledger = character.get('spentDice18', {})
                if all(ledger.get(r['key']) == r['token'] for r in command['rows']):
                    del self.db['onceJournal18'][key]
        except (ValueError, TypeError, KeyError):
            pass
