import './grid/dist.css';
export default function () {
  const aemGrids = getGridElements();
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.contentBoxSize) {
        const contentBoxSize: ResizeObserverSize = Array.isArray(
          entry.contentBoxSize
        )
          ? entry.contentBoxSize[0]
          : entry.contentBoxSize;
        const node = entry.target as HTMLElement;
        node.style.setProperty('--width', `${contentBoxSize.inlineSize}px`);
      }
    }
  });
  aemGrids.forEach((grid) => resizeObserver.observe(grid));
}

function returnWCMMode(input: string, delimiter: string) {
  return input
    .split(delimiter)
    .filter((e) => e.includes('wcmmode'))[0]
    ?.split('=')
    .pop();
}

function isEditMode() {
  const wcmmodeCookie = returnWCMMode(document.cookie, ';') === 'edit';
  const wcmmodeQueryDisabled =
    returnWCMMode(window.location.search, '?') === 'disabled';

  if (wcmmodeQueryDisabled) {
    return false;
  }
  if (wcmmodeCookie && !wcmmodeQueryDisabled) {
    return true;
  }
  return false;
}

function getGridElements() {
  if (!isEditMode()) {
    return document.querySelectorAll('.aem-Grid');
  }
  return document.querySelectorAll('.aem-Grid');
  return document
    .querySelector('iframe')
    .contentDocument.body.querySelectorAll('.aem-Grid');
}
