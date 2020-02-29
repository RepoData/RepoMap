var map = L.map('map').setView([38.850033, -96.6500523], 5)

map.addControl(new L.Control.Fullscreen())

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Data: <a href="https://github.com/repodata/repodata/">RepoData (ODbL 1.0)</a> | Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
	maxZoom: 15
}).addTo(map)

const markers = L.geoJSON(null, {
  pointToLayer: createClusterIcon,
  onEachFeature: (feature, layer) => {
    if (feature.properties.repository_name_unauthorized) {
      const r = feature.properties
      const parentOrg = r.parent_org_unauthorized ? r.parent_org_unauthorized + `<br>` : ``
      const desc = `
        ${r.repository_name_unauthorized}<br>
        ${parentOrg}
        ${r.street_address_1}<br>
        ${r.st_city}, ${r.state}<br>
        ${r.st_zip_code_5_numbers}<br>
        <em>${r.repository_type}</em><br>
        <a target="_blank" href="http://maps.google.com/maps?q=&layer=c&cbll=${r.longitude},${r.latitude}">Street View</a>
      `
      layer.bindPopup(desc)
    }
  }
}).addTo(map)

const worker = new Worker('worker.js')
let ready = false

worker.onmessage = e => {
  if (e.data.ready) {
    ready = true
    update()
  } else if (e.data.expansionZoom) {
    map.flyTo(e.data.center, e.data.expansionZoom)
  } else {
      markers.clearLayers()
      markers.addData(e.data)
  }
}

function update() {
  if (!ready) return
  const bounds = map.getBounds()
  worker.postMessage({
    bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
    zoom: map.getZoom()
  })
}

map.on('moveend', update)

function createClusterIcon(feature, latlng) {
  if (! feature.properties.cluster) return L.marker(latlng)

  const count = feature.properties.point_count
  const size = 
    count < 100 ? 'small' :
    count < 1000 ? 'medium' : 'large'
  const icon = L.divIcon({
    html: `<div><span>${  feature.properties.point_count_abbreviated  }</span></div>`,
    className: `marker-cluster marker-cluster-${  size}`,
    iconSize: L.point(40, 40)
  })

  return L.marker(latlng, {icon})
}

markers.on('click', (e) => {
  if (e.layer.feature.properties.cluster_id) {
    worker.postMessage({
      getClusterExpansionZoom: e.layer.feature.properties.cluster_id,
      center: e.latlng
    })
  }
})
