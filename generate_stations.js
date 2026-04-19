import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

const roadSegments = [
    { name: '长江中路', district: '庐阳区', start: [117.265, 31.870], end: [117.295, 31.870], weight: 5 },
    { name: '长江东路', district: '瑶海区', start: [117.295, 31.870], end: [117.370, 31.872], weight: 4 },
    { name: '长江西路', district: '蜀山区', start: [117.220, 31.870], end: [117.265, 31.870], weight: 4 },
    { name: '金寨路', district: '蜀山区', start: [117.260, 31.860], end: [117.260, 31.790], weight: 5 },
    { name: '金寨南路', district: '肥西县', start: [117.260, 31.790], end: [117.240, 31.700], weight: 3 },
    { name: '徽州大道', district: '包河区', start: [117.280, 31.860], end: [117.300, 31.780], weight: 5 },
    { name: '徽州大道南段', district: '滨湖新区', start: [117.300, 31.780], end: [117.310, 31.700], weight: 4 },
    { name: '黄山路', district: '蜀山区', start: [117.240, 31.840], end: [117.170, 31.840], weight: 4 },
    { name: '望江路', district: '蜀山区', start: [117.260, 31.820], end: [117.170, 31.820], weight: 4 },
    { name: '望江西路', district: '高新区', start: [117.170, 31.820], end: [117.120, 31.825], weight: 3 },
    { name: '潜山路', district: '政务区', start: [117.240, 31.870], end: [117.240, 31.810], weight: 4 },
    { name: '潜山路南段', district: '政务区', start: [117.240, 31.810], end: [117.240, 31.790], weight: 3 },
    { name: '合作化路', district: '蜀山区', start: [117.250, 31.860], end: [117.250, 31.820], weight: 3 },
    { name: '合作化南路', district: '政务区', start: [117.250, 31.820], end: [117.245, 31.790], weight: 3 },
    { name: '马鞍山路', district: '包河区', start: [117.300, 31.870], end: [117.305, 31.820], weight: 4 },
    { name: '马鞍山路南段', district: '包河区', start: [117.305, 31.820], end: [117.310, 31.780], weight: 3 },
    { name: '芜湖路', district: '包河区', start: [117.270, 31.862], end: [117.310, 31.862], weight: 4 },
    { name: '临泉路', district: '瑶海区', start: [117.305, 31.880], end: [117.380, 31.882], weight: 3 },
    { name: '繁华大道', district: '经开区', start: [117.200, 31.780], end: [117.280, 31.780], weight: 4 },
    { name: '繁华大道西', district: '肥西县', start: [117.150, 31.775], end: [117.200, 31.780], weight: 2 },
    { name: '繁华大道东', district: '包河区', start: [117.280, 31.780], end: [117.330, 31.775], weight: 3 },
    { name: '翡翠路', district: '政务区', start: [117.230, 31.860], end: [117.230, 31.800], weight: 4 },
    { name: '翡翠路南段', district: '经开区', start: [117.230, 31.800], end: [117.225, 31.760], weight: 3 },
    { name: '祁门路', district: '政务区', start: [117.210, 31.810], end: [117.260, 31.810], weight: 3 },
    { name: '天鹅湖路', district: '政务区', start: [117.215, 31.825], end: [117.255, 31.825], weight: 3 },
    { name: '政务路', district: '政务区', start: [117.220, 31.835], end: [117.250, 31.835], weight: 3 },
    { name: '龙川路', district: '包河区', start: [117.270, 31.810], end: [117.320, 31.810], weight: 3 },
    { name: '创新大道', district: '高新区', start: [117.150, 31.840], end: [117.150, 31.800], weight: 4 },
    { name: '创新大道南', district: '高新区', start: [117.150, 31.800], end: [117.145, 31.770], weight: 3 },
    { name: '文忠路', district: '瑶海区', start: [117.360, 31.880], end: [117.365, 31.920], weight: 3 },
    { name: '文忠路北段', district: '新站区', start: [117.365, 31.920], end: [117.370, 31.960], weight: 2 },
    { name: '宿州路', district: '庐阳区', start: [117.275, 31.875], end: [117.275, 31.860], weight: 3 },
    { name: '淮河路', district: '庐阳区', start: [117.268, 31.873], end: [117.295, 31.873], weight: 3 },
    { name: '寿春路', district: '庐阳区', start: [117.268, 31.868], end: [117.300, 31.868], weight: 3 },
    { name: '胜利路', district: '瑶海区', start: [117.295, 31.875], end: [117.310, 31.875], weight: 3 },
    { name: '铜陵路', district: '瑶海区', start: [117.320, 31.890], end: [117.320, 31.860], weight: 3 },
    { name: '当涂路', district: '瑶海区', start: [117.350, 31.890], end: [117.350, 31.860], weight: 3 },
    { name: '龙岗路', district: '瑶海区', start: [117.380, 31.880], end: [117.380, 31.920], weight: 2 },
    { name: '大众路', district: '新站区', start: [117.400, 31.890], end: [117.400, 31.940], weight: 2 },
    { name: '新海大道', district: '新站区', start: [117.360, 31.920], end: [117.420, 31.920], weight: 2 },
    { name: '北二环', district: '庐阳区', start: [117.240, 31.895], end: [117.340, 31.895], weight: 3 },
    { name: '北二环东段', district: '瑶海区', start: [117.340, 31.895], end: [117.400, 31.895], weight: 2 },
    { name: '南二环', district: '包河区', start: [117.240, 31.800], end: [117.330, 31.800], weight: 3 },
    { name: '西二环', district: '蜀山区', start: [117.210, 31.870], end: [117.210, 31.800], weight: 3 },
    { name: '东二环', district: '瑶海区', start: [117.340, 31.890], end: [117.340, 31.820], weight: 3 },
    { name: '方兴大道', district: '滨湖新区', start: [117.260, 31.750], end: [117.350, 31.750], weight: 3 },
    { name: '方兴大道西', district: '经开区', start: [117.200, 31.755], end: [117.260, 31.750], weight: 2 },
    { name: '云谷路', district: '滨湖新区', start: [117.270, 31.730], end: [117.340, 31.730], weight: 3 },
    { name: '中山路', district: '滨湖新区', start: [117.270, 31.740], end: [117.340, 31.740], weight: 4 },
    { name: '包河大道', district: '包河区', start: [117.320, 31.840], end: [117.330, 31.780], weight: 4 },
    { name: '包河大道南段', district: '滨湖新区', start: [117.330, 31.780], end: [117.335, 31.720], weight: 3 },
    { name: '上海路', district: '包河区', start: [117.330, 31.830], end: [117.335, 31.780], weight: 3 },
    { name: '北京路', district: '包河区', start: [117.315, 31.850], end: [117.320, 31.800], weight: 3 },
    { name: '紫云路', district: '经开区', start: [117.210, 31.760], end: [117.270, 31.760], weight: 3 },
    { name: '锦绣大道', district: '经开区', start: [117.210, 31.770], end: [117.270, 31.770], weight: 3 },
    { name: '始信路', district: '经开区', start: [117.220, 31.800], end: [117.220, 31.750], weight: 3 },
    { name: '习友路', district: '高新区', start: [117.170, 31.810], end: [117.240, 31.810], weight: 3 },
    { name: '习友路东段', district: '政务区', start: [117.240, 31.810], end: [117.270, 31.810], weight: 3 },
    { name: '科学路', district: '高新区', start: [117.170, 31.830], end: [117.130, 31.830], weight: 2 },
    { name: '香樟大道', district: '高新区', start: [117.140, 31.830], end: [117.140, 31.800], weight: 3 },
    { name: '玉兰大道', district: '高新区', start: [117.160, 31.830], end: [117.160, 31.800], weight: 3 },
    { name: '芙蓉路', district: '经开区', start: [117.220, 31.790], end: [117.270, 31.790], weight: 3 },
    { name: '莲花路', district: '经开区', start: [117.240, 31.800], end: [117.240, 31.760], weight: 3 },
    { name: '丹霞路', district: '经开区', start: [117.215, 31.770], end: [117.260, 31.770], weight: 2 },
    { name: '环湖北路', district: '滨湖新区', start: [117.280, 31.700], end: [117.340, 31.700], weight: 3 },
    { name: '环湖东路', district: '滨湖新区', start: [117.340, 31.700], end: [117.340, 31.740], weight: 2 },
    { name: '环湖西路', district: '滨湖新区', start: [117.280, 31.700], end: [117.280, 31.740], weight: 2 },
    { name: '庐州大道', district: '滨湖新区', start: [117.295, 31.760], end: [117.300, 31.710], weight: 3 },
    { name: '广西路', district: '滨湖新区', start: [117.310, 31.760], end: [117.310, 31.720], weight: 2 },
    { name: '杭州路', district: '滨湖新区', start: [117.280, 31.720], end: [117.330, 31.720], weight: 2 },
    { name: '南京路', district: '滨湖新区', start: [117.280, 31.750], end: [117.330, 31.750], weight: 2 },
    { name: '西藏路', district: '滨湖新区', start: [117.290, 31.760], end: [117.290, 31.710], weight: 2 },
    { name: '万年埠路', district: '滨湖新区', start: [117.305, 31.710], end: [117.335, 31.710], weight: 2 },
    { name: '洞庭湖路', district: '滨湖新区', start: [117.280, 31.715], end: [117.330, 31.715], weight: 2 },
    { name: '鄱阳湖路', district: '滨湖新区', start: [117.280, 31.705], end: [117.330, 31.705], weight: 2 },
    { name: '蒙城路', district: '庐阳区', start: [117.260, 31.895], end: [117.260, 31.860], weight: 3 },
    { name: '阜阳路', district: '庐阳区', start: [117.270, 31.900], end: [117.270, 31.860], weight: 3 },
    { name: '阜阳北路', district: '庐阳区', start: [117.270, 31.900], end: [117.268, 31.940], weight: 2 },
    { name: '颍上路', district: '庐阳区', start: [117.255, 31.890], end: [117.255, 31.860], weight: 2 },
    { name: '利辛路', district: '庐阳区', start: [117.262, 31.885], end: [117.290, 31.885], weight: 2 },
    { name: '固镇路', district: '庐阳区', start: [117.250, 31.890], end: [117.280, 31.890], weight: 2 },
    { name: '义井路', district: '庐阳区', start: [117.265, 31.878], end: [117.290, 31.878], weight: 2 },
    { name: '五河路', district: '庐阳区', start: [117.262, 31.883], end: [117.285, 31.883], weight: 2 },
    { name: '濉溪路', district: '庐阳区', start: [117.250, 31.892], end: [117.290, 31.892], weight: 2 },
    { name: '肥西路', district: '蜀山区', start: [117.255, 31.860], end: [117.255, 31.830], weight: 2 },
    { name: '石台路', district: '蜀山区', start: [117.235, 31.855], end: [117.235, 31.830], weight: 2 },
    { name: '青阳路', district: '蜀山区', start: [117.248, 31.860], end: [117.248, 31.835], weight: 2 },
    { name: '贵池路', district: '蜀山区', start: [117.240, 31.855], end: [117.265, 31.855], weight: 2 },
    { name: '池州路', district: '蜀山区', start: [117.245, 31.850], end: [117.260, 31.850], weight: 2 },
    { name: '东至路', district: '蜀山区', start: [117.252, 31.845], end: [117.252, 31.825], weight: 2 },
    { name: '太湖路', district: '包河区', start: [117.280, 31.840], end: [117.320, 31.840], weight: 2 },
    { name: '秋浦河路', district: '包河区', start: [117.285, 31.830], end: [117.320, 31.830], weight: 2 },
    { name: '花园大道', district: '包河区', start: [117.290, 31.790], end: [117.340, 31.790], weight: 2 },
    { name: '大连路', district: '包河区', start: [117.290, 31.800], end: [117.340, 31.800], weight: 2 },
    { name: '黄河路', district: '包河区', start: [117.295, 31.815], end: [117.330, 31.815], weight: 2 },
    { name: '长春街', district: '包河区', start: [117.290, 31.820], end: [117.330, 31.820], weight: 2 },
    { name: '九华山路的', district: '包河区', start: [117.275, 31.850], end: [117.310, 31.850], weight: 2 },
    { name: '宁国路', district: '包河区', start: [117.285, 31.860], end: [117.285, 31.830], weight: 2 },
    { name: '宣城路', district: '包河区', start: [117.280, 31.860], end: [117.280, 31.840], weight: 2 },
    { name: '巢湖路', district: '包河区', start: [117.275, 31.858], end: [117.300, 31.858], weight: 2 },
    { name: '淝河路', district: '包河区', start: [117.290, 31.840], end: [117.290, 31.800], weight: 2 },
    { name: '板桥河路', district: '瑶海区', start: [117.310, 31.885], end: [117.310, 31.860], weight: 2 },
    { name: '凤阳路', district: '瑶海区', start: [117.300, 31.878], end: [117.340, 31.878], weight: 2 },
    { name: '长江东大街', district: '瑶海区', start: [117.300, 31.873], end: [117.350, 31.873], weight: 3 },
    { name: '新安江路', district: '瑶海区', start: [117.310, 31.885], end: [117.370, 31.885], weight: 2 },
    { name: '裕溪路', district: '瑶海区', start: [117.300, 31.865], end: [117.360, 31.865], weight: 3 },
    { name: '和平路', district: '瑶海区', start: [117.300, 31.860], end: [117.340, 31.860], weight: 2 },
    { name: '大通路', district: '瑶海区', start: [117.295, 31.862], end: [117.330, 31.862], weight: 2 },
    { name: '明光路', district: '瑶海区', start: [117.300, 31.875], end: [117.300, 31.860], weight: 2 },
    { name: '一环路东段', district: '瑶海区', start: [117.305, 31.880], end: [117.340, 31.870], weight: 2 },
    { name: '郎溪路', district: '瑶海区', start: [117.360, 31.880], end: [117.360, 31.850], weight: 2 },
    { name: '广德路', district: '瑶海区', start: [117.370, 31.870], end: [117.370, 31.840], weight: 2 },
    { name: '梅冲湖路', district: '新站区', start: [117.360, 31.940], end: [117.420, 31.940], weight: 2 },
    { name: '魏武路', district: '新站区', start: [117.350, 31.950], end: [117.420, 31.950], weight: 2 },
    { name: '东方大道', district: '新站区', start: [117.360, 31.960], end: [117.420, 31.960], weight: 2 },
    { name: '淮海大道', district: '新站区', start: [117.350, 31.930], end: [117.410, 31.930], weight: 2 },
    { name: '学府路', district: '新站区', start: [117.370, 31.935], end: [117.400, 31.935], weight: 2 },
    { name: '龙子湖路', district: '新站区', start: [117.375, 31.945], end: [117.405, 31.945], weight: 2 },
    { name: '卧龙路', district: '新站区', start: [117.355, 31.935], end: [117.355, 31.960], weight: 1 },
    { name: '沱河路', district: '新站区', start: [117.365, 31.925], end: [117.400, 31.925], weight: 1 },
    { name: '柏堰路', district: '高新区', start: [117.170, 31.815], end: [117.130, 31.815], weight: 2 },
    { name: '海棠路', district: '高新区', start: [117.155, 31.825], end: [117.130, 31.825], weight: 2 },
    { name: '翠微路', district: '高新区', start: [117.165, 31.820], end: [117.135, 31.820], weight: 2 },
    { name: '石莲路', district: '高新区', start: [117.160, 31.808], end: [117.130, 31.808], weight: 2 },
    { name: '天湖路', district: '高新区', start: [117.145, 31.818], end: [117.125, 31.818], weight: 1 },
    { name: '云飞路', district: '高新区', start: [117.155, 31.805], end: [117.125, 31.805], weight: 1 },
    { name: '长宁大道', district: '高新区', start: [117.135, 31.840], end: [117.135, 31.800], weight: 2 },
    { name: '复兴路', district: '高新区', start: [117.125, 31.835], end: [117.125, 31.805], weight: 1 },
    { name: '耕耘路', district: '经开区', start: [117.215, 31.755], end: [117.260, 31.755], weight: 2 },
    { name: '天都路', district: '经开区', start: [117.205, 31.770], end: [117.205, 31.745], weight: 2 },
    { name: '耕云路', district: '经开区', start: [117.210, 31.748], end: [117.255, 31.748], weight: 1 },
    { name: '蓬莱路', district: '经开区', start: [117.235, 31.780], end: [117.235, 31.745], weight: 2 },
    { name: '松谷路', district: '经开区', start: [117.250, 31.780], end: [117.250, 31.750], weight: 2 },
    { name: '宝塔路', district: '经开区', start: [117.260, 31.780], end: [117.260, 31.750], weight: 2 },
    { name: '九龙路', district: '经开区', start: [117.205, 31.760], end: [117.205, 31.740], weight: 1 },
    { name: '汤口路', district: '肥西县', start: [117.200, 31.720], end: [117.150, 31.700], weight: 2 },
    { name: '金寨南路', district: '肥西县', start: [117.260, 31.790], end: [117.240, 31.700], weight: 3 },
    { name: '站前路', district: '肥西县', start: [117.170, 31.750], end: [117.210, 31.750], weight: 2 },
    { name: '派河大道', district: '肥西县', start: [117.160, 31.730], end: [117.160, 31.700], weight: 1 },
    { name: '合安路', district: '肥西县', start: [117.230, 31.710], end: [117.180, 31.680], weight: 2 },
    { name: '上派路', district: '肥西县', start: [117.190, 31.740], end: [117.150, 31.720], weight: 1 },
    { name: '人民路', district: '肥西县', start: [117.175, 31.730], end: [117.200, 31.730], weight: 1 },
    { name: '巢湖路', district: '肥西县', start: [117.185, 31.735], end: [117.210, 31.735], weight: 1 },
    { name: '长江东路', district: '肥东县', start: [117.370, 31.872], end: [117.450, 31.890], weight: 2 },
    { name: '长江东路东段', district: '肥东县', start: [117.450, 31.890], end: [117.520, 31.910], weight: 1 },
    { name: '临泉东路', district: '肥东县', start: [117.380, 31.882], end: [117.450, 31.895], weight: 2 },
    { name: '店忠路', district: '肥东县', start: [117.420, 31.880], end: [117.480, 31.930], weight: 1 },
    { name: '包公大道', district: '肥东县', start: [117.380, 31.870], end: [117.450, 31.870], weight: 2 },
    { name: '龙城路', district: '肥东县', start: [117.400, 31.900], end: [117.460, 31.900], weight: 1 },
    { name: '撮镇路', district: '肥东县', start: [117.430, 31.880], end: [117.480, 31.870], weight: 1 },
    { name: '桥头集路', district: '肥东县', start: [117.440, 31.890], end: [117.440, 31.940], weight: 1 },
    { name: '阜阳北路', district: '长丰县', start: [117.268, 31.940], end: [117.260, 32.050], weight: 2 },
    { name: '蒙城北路', district: '长丰县', start: [117.260, 31.940], end: [117.250, 32.050], weight: 2 },
    { name: '合水路', district: '长丰县', start: [117.255, 31.960], end: [117.240, 32.080], weight: 1 },
    { name: '双凤路', district: '长丰县', start: [117.260, 31.960], end: [117.300, 31.960], weight: 1 },
    { name: '凤麟路', district: '长丰县', start: [117.275, 31.950], end: [117.275, 32.000], weight: 1 },
    { name: '龙湖路', district: '长丰县', start: [117.265, 31.970], end: [117.300, 31.970], weight: 1 },
    { name: '濛河路', district: '长丰县', start: [117.260, 31.980], end: [117.295, 31.980], weight: 1 },
    { name: '庐巢路', district: '庐江县', start: [117.280, 31.260], end: [117.360, 31.260], weight: 2 },
    { name: '移湖路', district: '庐江县', start: [117.280, 31.255], end: [117.350, 31.255], weight: 1 },
    { name: '周瑜大道', district: '庐江县', start: [117.290, 31.250], end: [117.290, 31.280], weight: 2 },
    { name: '黄山南路', district: '庐江县', start: [117.285, 31.260], end: [117.285, 31.280], weight: 1 },
    { name: '文明路', district: '庐江县', start: [117.295, 31.250], end: [117.295, 31.275], weight: 1 },
    { name: '长江路', district: '庐江县', start: [117.300, 31.258], end: [117.340, 31.258], weight: 1 },
    { name: '塔山路', district: '庐江县', start: [117.305, 31.250], end: [117.305, 31.270], weight: 1 },
    { name: '内环北路', district: '庐江县', start: [117.288, 31.270], end: [117.310, 31.270], weight: 1 },
    { name: '黄山路', district: '庐江县', start: [117.292, 31.265], end: [117.330, 31.265], weight: 1 },
];

const brands = ['国家电网', '特来电', '星星充电', '小桔充电', '云快充', '依威能源', '小鹏汽车', '特斯拉', '蔚来', '理想汽车'];
const landmarks = ['万达广场', '银泰城', '大润发', '永辉超市', '万象城', '保利广场', '吾悦广场', '世纪金源', '恒大中心', '置地广场', '绿地中心', '高速时代广场', '百大购物中心', '商之都', '合家福超市', '红府超市', '乐城超市', '苏果超市', '华润万家', '盒马鲜生', '奥特莱斯', '砂之船', '银泰百货', '百盛购物中心', '之心城', '国购广场', '加侨广场', '漫乐城', '星悦广场', '弘阳广场'];
const parkFees = ['全天免费', '充电期间免费', '前2小时免费，之后5元/小时', '3元/小时', '5元/小时', '10元/天', '首小时免费，后续2元/小时'];
const openTimes = ['00:00-24:00', '06:00-22:00', '08:00-20:00', '07:00-23:00', '06:00-23:00'];
const connectorTypes = ['CCS Combo', 'GB/T', 'CHAdeMO', 'Type 2'];
const powerLevels = [
    { label: '慢充', power: 7, weight: 2 },
    { label: '快充', power: 60, weight: 3 },
    { label: '快充', power: 120, weight: 5 },
    { label: '超充', power: 180, weight: 3 },
    { label: '超充', power: 240, weight: 2 },
    { label: '超充', power: 360, weight: 1 }
];
const userNames = ['张先生', '李女士', '王先生', '赵女士', '刘先生', '陈女士', '杨先生', '黄女士', '周先生', '吴女士', '郑先生', '孙女士', '马先生', '朱先生', '胡女士', '林先生', '何先生', '徐先生', '钱女士', '沈先生'];
const reviewContents = [
    '充电速度快，位置方便！', '整体不错，高峰期需要排队。', '充电桩数量少，经常满员。',
    '充电速度很快，环境整洁，推荐！', '充电桩很多，从不排队。', '功率偏低，充电速度一般。',
    '购物充电两不误，很方便。', '24小时开放非常方便。', '停车费有点贵，但充电还行。',
    '设备维护中，无法使用。', '服务态度好，充电桩多。', '超充站，充电速度飞快！',
    '晚上充电更便宜，很划算。', '位置有点偏，不太好找。', '新站很干净，体验不错。',
    '价格合理，充电稳定。', '接口类型齐全，各种车都能充。', '地下停车场信号不太好。',
    '周边配套齐全，等充电时有地方逛。', '会员价很优惠，值得办卡。'
];

function pickRoad() {
    const totalWeight = roadSegments.reduce((sum, r) => sum + r.weight, 0);
    let r = Math.random() * totalWeight;
    for (const road of roadSegments) {
        r -= road.weight;
        if (r <= 0) return road;
    }
    return roadSegments[0];
}

function generatePointOnRoad(road) {
    const t = Math.random();
    const lng = road.start[0] + (road.end[0] - road.start[0]) * t;
    const lat = road.start[1] + (road.end[1] - road.start[1]) * t;

    const dx = road.end[0] - road.start[0];
    const dy = road.end[1] - road.start[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { lng, lat };

    const perpX = -dy / len;
    const perpY = dx / len;

    const offsetMeters = (Math.random() - 0.5) * 80;
    const latOffset = offsetMeters / 111000;
    const lngOffset = offsetMeters / (111000 * Math.cos(lat * Math.PI / 180));

    return {
        lng: parseFloat((lng + perpX * lngOffset).toFixed(6)),
        lat: parseFloat((lat + perpY * latOffset).toFixed(6))
    };
}

function generateStationList(count, startId = 1) {
    const stations = [];
    const usedIds = new Set();

    for (let i = 0; i < count; i++) {
        let stationId;
        do {
            stationId = `HF${String(startId + i).padStart(6, '0')}`;
        } while (usedIds.has(stationId));
        usedIds.add(stationId);

        const road = pickRoad();
        const district = road.district;
        const pos = generatePointOnRoad(road);

        const quickChargeNum = randomInt(2, 16);
        const slowChargeNum = randomInt(2, 10);
        const openStatus = Math.random() < 0.92 ? 1 : 0;
        const quickAvailableNum = openStatus === 0 ? 0 : randomInt(0, quickChargeNum);
        const slowAvailableNum = openStatus === 0 ? 0 : randomInt(0, slowChargeNum);

        const electricityPrice = parseFloat(random(0.5, 1.2).toFixed(2));
        const servicePrice = parseFloat(random(0.2, 0.6).toFixed(2));
        const totalCostPrice = parseFloat((electricityPrice + servicePrice).toFixed(2));

        const hasMember = Math.random() > 0.3;
        const memberPrice = hasMember ? parseFloat((totalCostPrice * 0.88).toFixed(2)) : null;

        let stationName;
        const nameStyle = randomInt(1, 4);
        const brand = pick(brands);
        if (nameStyle === 1) {
            stationName = `${brand}·${road.name}充电站`;
        } else if (nameStyle === 2) {
            stationName = `${brand}·${pick(landmarks)}充电站`;
        } else if (nameStyle === 3) {
            stationName = `${district}${road.name}${randomInt(1, 300)}号充电站`;
        } else {
            stationName = `${brand}·${road.name}充电站`;
        }

        const maxPower = pick(powerLevels.filter(p => p.power >= 60)).power;
        const hasAvailable = quickAvailableNum > 0 || slowAvailableNum > 0;

        stations.push({
            stationId,
            stationName,
            address: `安徽省合肥市${district}${road.name}${randomInt(1, 300)}号`,
            lng: pos.lng,
            lat: pos.lat,
            district,
            distance: parseFloat(random(200, 15000).toFixed(0)),
            quickChargeNum,
            quickAvailableNum,
            slowChargeNum,
            slowAvailableNum,
            totalCostPrice,
            memberPrice,
            reservationAvailable: openStatus === 1 && hasAvailable && Math.random() > 0.35,
            maxPower,
            openStatus,
            openTime: openStatus ? pick(openTimes) : '00:00-24:00',
            parkFee: pick(parkFees),
            stationTel: `0551-${randomInt(60000000, 69999999)}`,
            stationGradeScore: parseFloat(random(3.0, 5.0).toFixed(1))
        });
    }

    return stations;
}

function generateStationDetails(stations) {
    const details = {};

    const timePeriods = [
        { startTime: '00:00', endTime: '06:00' },
        { startTime: '06:00', endTime: '08:00' },
        { startTime: '08:00', endTime: '11:00' },
        { startTime: '11:00', endTime: '14:00' },
        { startTime: '14:00', endTime: '18:00' },
        { startTime: '18:00', endTime: '21:00' },
        { startTime: '21:00', endTime: '23:00' },
        { startTime: '23:00', endTime: '24:00' }
    ];

    const currentHour = new Date().getHours();

    for (const station of stations) {
        const stationConnectorTypes = [];
        const typeSet = new Set();
        while (typeSet.size < randomInt(1, 3)) {
            typeSet.add(pick(connectorTypes));
        }
        typeSet.forEach(t => stationConnectorTypes.push(t));

        const fastConnectors = [];
        for (let i = 0; i < station.quickChargeNum; i++) {
            let status;
            if (station.openStatus === 0) {
                status = 0;
            } else if (i < station.quickAvailableNum) {
                status = 1;
            } else {
                const rand = Math.random();
                if (rand < 0.75) status = 3;
                else if (rand < 0.92) status = 2;
                else status = 255;
            }

            const powerOption = pick(powerLevels.filter(p => p.power >= 60));

            fastConnectors.push({
                id: `${station.stationId}-FC-${i + 1}`,
                connectorName: `${powerOption.label}${i + 1}`,
                power: powerOption.power,
                connectorType: pick(stationConnectorTypes),
                status
            });
        }

        const slowConnectors = [];
        for (let i = 0; i < station.slowChargeNum; i++) {
            let status;
            if (station.openStatus === 0) {
                status = 0;
            } else if (i < station.slowAvailableNum) {
                status = 1;
            } else {
                const rand = Math.random();
                if (rand < 0.75) status = 3;
                else if (rand < 0.92) status = 2;
                else status = 255;
            }

            slowConnectors.push({
                id: `${station.stationId}-SC-${i + 1}`,
                connectorName: `慢充${i + 1}`,
                power: 7,
                connectorType: pick(stationConnectorTypes),
                status
            });
        }

        const periodPrices = timePeriods.map((period, index) => {
            const startHour = parseInt(period.startTime.split(':')[0]);
            const endHour = parseInt(period.endTime.split(':')[0]);
            let baseFee;
            if (startHour >= 0 && startHour < 6) baseFee = random(0.3, 0.5);
            else if (startHour >= 6 && startHour < 8) baseFee = random(0.6, 0.8);
            else if (startHour >= 8 && startHour < 18) baseFee = random(0.9, 1.4);
            else baseFee = random(0.7, 1.1);

            const totalFee = parseFloat(baseFee.toFixed(2));
            const hasMember = station.memberPrice !== null;
            const memberFee = hasMember ? parseFloat((totalFee * 0.88).toFixed(2)).toString() : null;

            let isCurrent = false;
            let isNext = false;
            if (startHour <= currentHour && (endHour > currentHour || endHour === 0)) {
                isCurrent = true;
            }
            const nextIndex = index + 1;
            if (nextIndex < timePeriods.length) {
                const nextStart = parseInt(timePeriods[nextIndex].startTime.split(':')[0]);
                if (nextStart > currentHour && !isCurrent) {
                    isNext = true;
                }
            }

            return {
                startTime: period.startTime,
                endTime: period.endTime,
                totalFee: totalFee.toString(),
                memberPrice: memberFee,
                currentFlag: isCurrent,
                nextFlag: isNext
            };
        });

        const reviewsCount = randomInt(5, 300);
        const reviewNum = randomInt(1, Math.min(5, reviewsCount));
        const reviews = [];
        for (let r = 0; r < reviewNum; r++) {
            reviews.push({
                id: `${station.stationId}-R-${r + 1}`,
                userName: pick(userNames),
                rating: randomInt(2, 5),
                content: pick(reviewContents),
                date: `${new Date().getFullYear()}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
                images: []
            });
        }

        const roadNames = roadSegments.map(r => r.name);
        details[station.stationId] = {
            stationId: station.stationId,
            connectorTypes: stationConnectorTypes,
            fastConnectors,
            slowConnectors,
            periodPrices,
            reviewsCount,
            reviews,
            siteGuide: `位于${station.address}内，从${pick(roadNames)}入口进入后${pick(['左转', '右转', '直行'])}${randomInt(50, 300)}米即可看到充电区域。`
        };
    }

    return details;
}

const publicDataDir = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
}

const listPath = path.join(publicDataDir, 'station_list.json');
const detailsPath = path.join(publicDataDir, 'station_details.json');

let existingStations = [];
let existingDetails = {};
let startId = 1;

if (fs.existsSync(listPath) && fs.existsSync(detailsPath)) {
    try {
        existingStations = JSON.parse(fs.readFileSync(listPath, 'utf8'));
        existingDetails = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));

        const maxIdNum = existingStations.reduce((max, s) => {
            const num = parseInt(s.stationId.replace('HF', ''), 10);
            return num > max ? num : max;
        }, 0);
        startId = maxIdNum + 1;

        console.log(`发现已有数据: ${existingStations.length} 个站点，新站点从 HF${String(startId).padStart(6, '0')} 开始`);
    } catch (err) {
        console.warn('读取已有数据失败，将重新生成:', err.message);
        existingStations = [];
        existingDetails = {};
        startId = 1;
    }
}

const stationCount = 2000;
const newStations = generateStationList(stationCount, startId);
const newDetails = generateStationDetails(newStations);

const allStations = [...existingStations, ...newStations];
const allDetails = { ...existingDetails, ...newDetails };

fs.writeFileSync(listPath, JSON.stringify(allStations), 'utf8');
fs.writeFileSync(detailsPath, JSON.stringify(allDetails), 'utf8');

const listSize = (fs.statSync(listPath).size / 1024 / 1024).toFixed(2);
const detailsSize = (fs.statSync(detailsPath).size / 1024 / 1024).toFixed(2);

console.log(`本次新增 ${stationCount} 个站点，总计 ${allStations.length} 个站点`);
console.log(`站点列表: ${listPath} (${listSize} MB)`);
console.log(`站点详情: ${detailsPath} (${detailsSize} MB)`);

const statusCounts = { open: 0, closed: 0 };
allStations.forEach(s => { s.openStatus === 1 ? statusCounts.open++ : statusCounts.closed++; });
console.log(`\n状态分布: ${statusCounts.open}个营业中, ${statusCounts.closed}个维护中`);

const districtCounts = {};
allStations.forEach(s => {
    const d = s.district || '未知';
    districtCounts[d] = (districtCounts[d] || 0) + 1;
});
console.log('\n区域分布:');
Object.entries(districtCounts).sort((a, b) => b[1] - a[1]).forEach(([d, count]) => {
    console.log(`  ${d}: ${count}个`);
});

const roadCounts = {};
allStations.forEach(s => {
    const roadName = s.address.match(/(?:蜀山区|包河区|庐阳区|瑶海区|滨湖新区|政务区|高新区|经开区|新站区|肥西县|肥东县|长丰县|庐江县)(.+?)(?:\d+号$)/);
    if (roadName) {
        const rn = roadName[1];
        roadCounts[rn] = (roadCounts[rn] || 0) + 1;
    }
});
console.log('\n道路分布 (前20):');
Object.entries(roadCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([rn, count]) => {
    console.log(`  ${rn}: ${count}个`);
});

const latValues = allStations.map(s => s.lat);
const lngValues = allStations.map(s => s.lng);
console.log(`\n经纬度覆盖范围:`);
console.log(`  纬度: ${Math.min(...latValues).toFixed(4)} ~ ${Math.max(...latValues).toFixed(4)}`);
console.log(`  经度: ${Math.min(...lngValues).toFixed(4)} ~ ${Math.max(...lngValues).toFixed(4)}`);
