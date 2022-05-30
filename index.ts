import './grid/dist.css';
export default function () {
  const aemGrids = document.querySelectorAll('.aem-Grid');
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
