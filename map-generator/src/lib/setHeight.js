export default function setHeight(cell, height) {
  // Set height
  cell.height = height;

  // Set neighbours' heights
  if (height > 0.01) {
    cell.links.forEach(neighbour => {
      if (neighbour.height < height * 0.9) {
        setHeight(neighbour, height * 0.9);
      }
    });
  }
};
