export function roundHeight(cells) {
  return cells.map(cell => {
    cell.height = Math.sqrt(cell.height);
    return cell;
  });
}

export function relaxHeight(cells) {
  return cells.map(cell => {
    cell.height = cell.links.reduce((sum, neighbour) => sum + neighbour.height, 0) / cell.links.length;
    return cell;
  });
}

export function normalizeHeight(cells) {
  const heightScale = d3.scaleLinear()
    .domain([d3.min(cells, d => d.height), d3.max(cells, d => d.height)]);

  return cells.map(cell => {
    cell.height = heightScale(cell.height);
    return cell;
  });
}
