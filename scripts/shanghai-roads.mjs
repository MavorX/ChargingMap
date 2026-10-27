// Approximate GCJ-02 road corridors for simulated sites, not surveyed POIs.
// Keep corridors short and on one bank; do not draw straight across the Huangpu.
export const shanghaiRoads = [
  { name: '南京西路', district: '黄浦区', start: [121.466, 31.232], end: [121.476, 31.234], weight: 5 },
  { name: '西藏中路', district: '黄浦区', start: [121.475, 31.226], end: [121.475, 31.24], weight: 5 },
  { name: '淮海中路', district: '黄浦区', start: [121.46, 31.219], end: [121.48, 31.226], weight: 5 },
  { name: '中山南路', district: '黄浦区', start: [121.493, 31.206], end: [121.505, 31.212], weight: 3 },
  { name: '南京西路', district: '静安区', start: [121.445, 31.225], end: [121.46, 31.23], weight: 5 },
  { name: '共和新路', district: '静安区', start: [121.458, 31.263], end: [121.451, 31.298], weight: 3 },
  { name: '漕溪北路', district: '徐汇区', start: [121.436, 31.192], end: [121.437, 31.18], weight: 5 },
  { name: '肇嘉浜路', district: '徐汇区', start: [121.441, 31.196], end: [121.461, 31.204], weight: 4 },
  { name: '龙腾大道', district: '徐汇区', start: [121.459, 31.174], end: [121.461, 31.184], weight: 3 },
  { name: '虹桥路', district: '长宁区', start: [121.391, 31.202], end: [121.416, 31.208], weight: 4 },
  { name: '长宁路', district: '长宁区', start: [121.404, 31.22], end: [121.421, 31.219], weight: 4 },
  { name: '金沙江路', district: '普陀区', start: [121.365, 31.237], end: [121.409, 31.233], weight: 3 },
  { name: '真北路', district: '普陀区', start: [121.388, 31.242], end: [121.39, 31.269], weight: 3 },
  { name: '四川北路', district: '虹口区', start: [121.485, 31.252], end: [121.48, 31.269], weight: 4 },
  { name: '东大名路', district: '虹口区', start: [121.494, 31.254], end: [121.509, 31.257], weight: 3 },
  { name: '四平路', district: '杨浦区', start: [121.501, 31.283], end: [121.517, 31.3], weight: 4 },
  { name: '淞沪路', district: '杨浦区', start: [121.513, 31.305], end: [121.51, 31.327], weight: 3 },
  { name: '陆家嘴环路', district: '浦东新区', start: [121.505, 31.242], end: [121.512, 31.24], weight: 5 },
  { name: '世纪大道', district: '浦东新区', start: [121.518, 31.235], end: [121.544, 31.22], weight: 5 },
  { name: '张杨路', district: '浦东新区', start: [121.53, 31.229], end: [121.56, 31.24], weight: 4 },
  { name: '芳甸路', district: '浦东新区', start: [121.563, 31.211], end: [121.565, 31.23], weight: 4 },
  { name: '张江路', district: '浦东新区', start: [121.61, 31.199], end: [121.612, 31.217], weight: 4 },
  { name: '祖冲之路', district: '浦东新区', start: [121.588, 31.205], end: [121.621, 31.211], weight: 4 },
  { name: '申迪南路', district: '浦东新区', start: [121.653, 31.13], end: [121.675, 31.133], weight: 2 },
  { name: '沪城环路', district: '浦东新区', start: [121.88, 30.895], end: [121.906, 30.895], weight: 2 },
  { name: '申长路', district: '闵行区', start: [121.315, 31.19], end: [121.315, 31.213], weight: 4 },
  { name: '七莘路', district: '闵行区', start: [121.353, 31.143], end: [121.36, 31.174], weight: 3 },
  { name: '东川路', district: '闵行区', start: [121.418, 31.023], end: [121.442, 31.026], weight: 2 },
  { name: '牡丹江路', district: '宝山区', start: [121.485, 31.387], end: [121.485, 31.408], weight: 2 },
  { name: '真华路', district: '宝山区', start: [121.421, 31.306], end: [121.422, 31.327], weight: 2 },
  { name: '阿克苏路', district: '嘉定区', start: [121.256, 31.343], end: [121.26, 31.364], weight: 2 },
  { name: '博乐路', district: '嘉定区', start: [121.25, 31.379], end: [121.252, 31.391], weight: 2 },
  { name: '广富林路', district: '松江区', start: [121.205, 31.056], end: [121.239, 31.057], weight: 2 },
  { name: '文翔路', district: '松江区', start: [121.218, 31.046], end: [121.249, 31.047], weight: 2 },
  { name: '崧泽大道', district: '青浦区', start: [121.272, 31.192], end: [121.305, 31.193], weight: 3 },
  { name: '公园东路', district: '青浦区', start: [121.111, 31.148], end: [121.134, 31.149], weight: 1 },
  { name: '南奉公路', district: '奉贤区', start: [121.458, 30.918], end: [121.487, 30.918], weight: 2 },
  { name: '金山大道', district: '金山区', start: [121.312, 30.746], end: [121.344, 30.746], weight: 1 },
  { name: '城桥路', district: '崇明区', start: [121.393, 31.623], end: [121.404, 31.624], weight: 1 }
];

// Always-available starting sites make a Shanghai presentation repeatable.
export const shanghaiShowcaseSites = [
  { stationName: '上海·人民广场演示充电站', district: '黄浦区', road: '南京西路', address: '上海市黄浦区南京西路100号（模拟站点）', lng: 121.4728, lat: 31.2331 },
  { stationName: '上海·陆家嘴演示超充站', district: '浦东新区', road: '陆家嘴环路', address: '上海市浦东新区陆家嘴环路500号（模拟站点）', lng: 121.5086, lat: 31.2412 },
  { stationName: '上海·徐家汇演示充电站', district: '徐汇区', road: '漕溪北路', address: '上海市徐汇区漕溪北路100号（模拟站点）', lng: 121.4365, lat: 31.19 }
];
