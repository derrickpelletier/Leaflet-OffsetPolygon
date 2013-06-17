// 
// Class creates a polygon with a second polygon inside which has offset/buffered edges.
// Similar to an inner-fill
// Need to make few options for delta size, buffered color, etc... currently inline
// 
L.OffsetPolygon = L.LayerGroup.extend({
  // 
  // This init method creates and adds a base polygon to the group
  // the offset polygon is created, but not added yet, only once we add the base to the map
  // so that the points can be offset by pixel vals
  // 
  initialize: function(latlngs, options){
    this._layers = {}
    this.base = L.polygon(latlngs, options)
    this.addLayer(this.base)
    this.offset = L.polygon(latlngs, {
      fillColor: options.fillColor,
      fillOpacity: 0.05,
      stroke: false
    })
  }

  , onAdd: function(map){
    this._map = map

    // Add the base poly to the map
    map.addLayer(this.base)

    // Max and min zooms for this object
    var max = 18
      , min = 13
      , zoom = map.getZoom()

    if(zoom >= min && zoom <= max) {

      // Calculate the current delta (the amount to offset), based on the current zoom level
      var current = zoom - min
      var delta = Math.round(-( (current / 6) * 20 ) - 5)
      
      var clip = this.base.getClipPolygon()
      var offsetted_polygon =  new ClipperLib.Clipper().OffsetPolygons(clip, delta, ClipperLib.JoinType.jtRound, 1, true)

      // Project this polygon one point at a time, first converting each coord to a L.Point, and then transforming
      var projected = []
      for(var a = 0; a < offsetted_polygon.length; a++){
        var ring = []
        for(var b = 0; b < offsetted_polygon[a].length; b++){
          ring.push(map.layerPointToLatLng(new L.Point(offsetted_polygon[a][b].X, offsetted_polygon[a][b].Y)))
        }
        projected.push(ring)
      }

      // The projected polygon could be blank...
      if(projected.length > 0) {
        this.offset.setLatLngs(projected[0])
        // Add the offset to the Group, added to map automatically
        this.addLayer(this.offset)
      }

    }
  }
})
L.offsetPolygon = function (latlngs, options) {
  return new L.OffsetPolygon(latlngs, options)
}

// 
// This will use jsclipper to return a ClipperLib polygon which we can manipulate
// 
L.Polygon.prototype.getClipPolygon = function() {
  if(!this.hasOwnProperty("_parts")) return []
  var clip_polygons = new ClipperLib.Polygons()
  for( var a = 0; a < this._parts.length; a++){
    var clip_polygon = new ClipperLib.Polygon()
    for(var b = 0; b < this._parts[a].length; b++){
      clip_polygon.push(new ClipperLib.IntPoint(this._parts[a][b].x, this._parts[a][b].y))
    }
    clip_polygons.push(clip_polygon)
  }
  return clip_polygons
}