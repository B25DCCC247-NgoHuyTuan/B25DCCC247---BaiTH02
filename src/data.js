export const CITIES = [
  { id: "hanoi", name: "Hà Nội", lat: 21.0285, lon: 105.8542 },
  { id: "haiphong", name: "Hải Phòng", lat: 20.8449, lon: 106.6881 },
  { id: "hue", name: "Huế", lat: 16.4637, lon: 107.5909 },
  { id: "danang", name: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
  { id: "nhatrang", name: "Nha Trang", lat: 12.2388, lon: 109.1967 },
  { id: "dalat", name: "Đà Lạt", lat: 11.9404, lon: 108.4583 },
  { id: "hcm", name: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297 },
  { id: "cantho", name: "Cần Thơ", lat: 10.0452, lon: 105.7469 },
];

// Mã thời tiết WMO -> biểu tượng, mô tả, nhóm (dùng để đổi màu nền)
export function describeWeather(code) {
  if (code === 0) return { icon: "☀️", text: "Trời quang", group: "sunny" };
  if (code === 1) return { icon: "🌤️", text: "Gần như quang đãng", group: "sunny" };
  if (code === 2) return { icon: "⛅", text: "Có mây rải rác", group: "cloudy" };
  if (code === 3) return { icon: "☁️", text: "Nhiều mây", group: "cloudy" };
  if (code === 45 || code === 48) return { icon: "🌫️", text: "Sương mù", group: "fog" };
  if (code >= 51 && code <= 57) return { icon: "🌦️", text: "Mưa phùn", group: "rain" };
  if (code >= 61 && code <= 65) return { icon: "🌧️", text: "Mưa", group: "rain" };
  if (code === 66 || code === 67) return { icon: "🌧️", text: "Mưa lạnh", group: "rain" };
  if (code >= 71 && code <= 77) return { icon: "❄️", text: "Tuyết", group: "fog" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", text: "Mưa rào", group: "rain" };
  if (code === 85 || code === 86) return { icon: "🌨️", text: "Mưa tuyết", group: "fog" };
  if (code === 95) return { icon: "⛈️", text: "Dông", group: "storm" };
  if (code === 96 || code === 99) return { icon: "⛈️", text: "Dông kèm mưa đá", group: "storm" };
  return { icon: "❓", text: "Không xác định", group: "cloudy" };
}

// Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
export function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

// Chỉ đổi đơn vị khi hiển thị, dữ liệu gốc luôn giữ ở °C
export function formatTemp(celsius, unit) {
  const value = unit === "F" ? (celsius * 9) / 5 + 32 : celsius;
  return `${Math.round(value)}°${unit}`;
}

const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

// "2026-11-08" -> { weekday: "Chủ nhật", date: "08/11" } (tránh lệch múi giờ khi parse)
export function formatDay(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: WEEKDAYS[date.getDay()],
    date: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
  };
}

// "2026-11-08T14:15" -> "14:15 08/11/2026"
export function formatUpdateTime(isoDateTime) {
  const [datePart, timePart] = isoDateTime.split("T");
  const [y, m, d] = datePart.split("-");
  return `${timePart} ${d}/${m}/${y}`;
}