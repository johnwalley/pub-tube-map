export default class pubs {
  constructor() {
  }

  findNearestPub(stations, latitude, longitude) {
    let minDistance = 10000000;
    let nearestPub;

    for (const key in stations) {
      if (!stations.hasOwnProperty(key)) continue;

      const distance = Math.pow(stations[key].position.lat - latitude, 2) + Math.pow(stations[key].position.lon - longitude, 2);

      if (distance < minDistance) {
        minDistance = distance;
        nearestPub = key;
      }
    }

    return nearestPub;
  }

  findRandomPub(pubs) {
    let tempKey;
    const keys = [];
    for (tempKey in pubs) {
      if (pubs.hasOwnProperty(tempKey)) {
        keys.push(tempKey);
      }
    }
    return keys[Math.floor(Math.random() * keys.length)];
  }
}
