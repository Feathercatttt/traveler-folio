const mainSearchBefore27=mainSearchHTML26;mainSearchHTML26=function(){return mainSearchBefore27().replace('<div id="searchResults26"',FolioFormula27.formulaHelpHTML27()+'<div id="searchResults26"');};
const checkSearchBefore27=checkSearchHTML17;checkSearchHTML17=function(scope='main'){return checkSearchBefore27(scope).replace('<div class="checkfinder17-results"',FolioFormula27.formulaHelpHTML27()+'<div class="checkfinder17-results"');};
const initializeFloatingBefore27=initializeFloating13;initializeFloating13=function(win,mode){initializeFloatingBefore27(win,mode);FolioFormula27.installFormulaHelp27(win.document);const style=win.document.createElement('style');style.textContent=document.getElementById('formulaHelpStyles27').textContent;win.document.head.append(style);};
document.querySelector('.quick-top [data-action="quick-settings"]')?.insertAdjacentHTML('beforebegin',FolioFormula27.formulaHelpHTML27());
FolioFormula27.installFormulaHelp27(document);
