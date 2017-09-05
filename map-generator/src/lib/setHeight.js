export default function setHeight(cell, height) {
  // Set height
  cell.height = height;

  // Build a list of neighbouring cells
  const queue = cell.links.map(cell => [cell, height]);

  // Set the height of each cell in the list and, if it's still above sea-level,
  // then iterate down to neighbours. Using push/shift makes the order work.
  while (queue.length) {
    const [cell, parentHeight] = queue.shift();
    const subHeight = parentHeight - 0.2;// * (0.8 + (Math.random() * 0.4));
    cell.height = subHeight;

    if (subHeight > 0.1) {
      cell.links
        .filter(neighbour => neighbour.height === 0)
        .forEach(neighbour => {
          queue.push([neighbour, subHeight]);
        });
    }
  }
};
