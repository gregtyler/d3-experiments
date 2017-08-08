export default function setHeight(cell, height) {
  // Set height
  cell.height = height;

  // Set neighbours' heights
  if (height > 1) {
    cell.links.forEach(neighbour => {
      if (neighbour.height < height - 1) {
        setHeight(neighbour, height - 1);
      }
    });
  }
};
