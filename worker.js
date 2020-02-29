importScripts('./supercluster.min.js')

const now = Date.now()

let index

fetch('data.geojson')
  .then(response => response.json())
  .then(geojson => {

    console.log(`loaded ${geojson.features.length} points JSON in ${  (Date.now() - now) / 1000  }s`);
    index = new Supercluster({
      log: true,
      radius: 60,
      extent: 256,
      maxZoom: 16
    }).load(geojson.features)

    console.log(index.getTile(0, 0, 0))
    postMessage({ready: true})
  })

self.onmessage = e => {
  if (e.data.getClusterExpansionZoom) {
    postMessage({
      expansionZoom: index.getClusterExpansionZoom(e.data.getClusterExpansionZoom),
      center: e.data.center
    })
  } else if (e.data) {
    postMessage(index.getClusters(e.data.bbox, e.data.zoom))
  }
}
