function getWaterFlux(cell) {
  if (cell.uphills.length === 0) {
   cell.waterFlux = 0;
  } else if (typeof cell.waterFlux === 'undefined') {
    cell.waterFlux = cell.uphills.length + cell.uphills.reduce((sum, uphill) => getWaterFlux(uphill), 0);
  }

  return cell.waterFlux;
}

export function calculateWaterFlux(cells) {
  cells.forEach(cell => {
    getWaterFlux(cell);
  });
};
