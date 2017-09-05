const heightFunctions = {
  cone: parentHeight => (0.7 * (parentHeight)),
  hill: () => 0.7,
  cos: parentHeight => Math.cos(parentHeight) / 4
};

export default function setHeight(cell, height, type = 'random') {
  // Deal with the type
  if (type === 'random') {
    type = Object.keys(heightFunctions)[Math.floor(Math.random() * Object.keys(heightFunctions).length)];
  }

  // Set height
  cell.height = height;

  // Build a list of neighbouring cells
  const queue = cell.links.map(cell => [cell, height]);

  // Set the height of each cell in the list and, if it's still above sea-level,
  // then iterate down to neighbours. Using push/shift makes the order work.
  while (queue.length) {
    const [cell, parentHeight] = queue.shift();
    const subHeight = Math.max(parentHeight - heightFunctions[type](parentHeight) + (Math.random() * 0.1), 0);
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
