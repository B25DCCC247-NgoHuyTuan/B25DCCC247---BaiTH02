import { useEffect, useMemo, useState, useCallback } from "react";
import { CITIES, describeWeather, normalize, formatTemp, formatDay, formatUpdateTime } from "./data.js";
import { fetchWeather } from "./api.js";

const FAV_KEY = "weather-vn:favorites";

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(loadFavorites);
  const [reloadKey, setReloadKey] = useState(0);

  const selectedCity = CITIES.find((c) => c.id === selectedId) || null;

  // Gọi API khi đổi thành phố hoặc bấm "Thử lại". Đổi °C/°F KHÔNG chạy lại effect này.
  useEffect(() => {
    if (!selectedCity) return;
    const controller = new AbortController();
    setStatus("loading");
    setError("");

    fetchWeather(selectedCity, controller.signal)
      .then((data) => {
        setWeather(data);
        setStatus("success");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Không thể kết nối tới máy chủ");
        setStatus("error");
      });

    return () => controller.abort();
  }, [selectedId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch {
      /* bỏ qua nếu localStorage bị chặn */
    }
  }, [favorites]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const visibleCities = useMemo(() => {
    const q = normalize(query);
    const filtered = CITIES.filter((c) => normalize(c.name).includes(q));
    // Thành phố yêu thích lên đầu, giữ nguyên thứ tự gốc trong từng nhóm
    return [...filtered].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));
  }, [query, favorites]);

  const theme = status === "success" && weather ? describeWeather(weather.current.code).group : "default";

  return (
    <div className="app" data-theme={theme}>
      <header className="header">
        <h1>Thời tiết Việt Nam</h1>
        <div className="unit-toggle" role="group" aria-label="Đơn vị nhiệt độ">
          {["C", "F"].map((u) => (
            <button
              key={u}
              type="button"
              className={unit === u ? "active" : ""}
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
            >
              °{u}
            </button>
          ))}
        </div>
      </header>

      <main className="layout">
        <aside className="panel cities">
          <input
            type="search"
            className="search"
            placeholder="Tìm thành phố (không cần dấu)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm thành phố"
          />
          <ul className="city-list">
            {visibleCities.map((city) => {
              const isFav = favorites.includes(city.id);
              const isActive = city.id === selectedId;
              return (
                <li key={city.id} className={`city-item ${isActive ? "selected" : ""}`}>
                  <button
                    type="button"
                    className="city-btn"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setSelectedId(city.id)}
                  >
                    {city.name}
                  </button>
                  <button
                    type="button"
                    className={`fav-btn ${isFav ? "on" : ""}`}
                    aria-label={isFav ? `Bỏ yêu thích ${city.name}` : `Yêu thích ${city.name}`}
                    aria-pressed={isFav}
                    onClick={() => toggleFavorite(city.id)}
                  >
                    {isFav ? "★" : "☆"}
                  </button>
                </li>
              );
            })}
            {visibleCities.length === 0 && <li className="no-result">Không tìm thấy thành phố phù hợp.</li>}
          </ul>
        </aside>

        <section className="panel detail" aria-live="polite">
          {status === "idle" && (
            <div className="state">
              <p className="state-title">Chưa chọn thành phố</p>
              <p>Chọn một thành phố trong danh sách để xem thời tiết.</p>
            </div>
          )}

          {status === "loading" && (
            <div className="state">
              <div className="spinner" aria-hidden="true" />
              <p>Đang tải thời tiết {selectedCity?.name}...</p>
            </div>
          )}

          {status === "error" && (
            <div className="state error">
              <p className="state-title">Không tải được dữ liệu</p>
              <p>{error}</p>
              <button type="button" className="retry" onClick={() => setReloadKey((k) => k + 1)}>
                Thử lại
              </button>
            </div>
          )}

          {status === "success" && weather && selectedCity && (
            <>
              <CurrentWeather city={selectedCity} current={weather.current} unit={unit} />
              <Forecast daily={weather.daily} unit={unit} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function CurrentWeather({ city, current, unit }) {
  const info = describeWeather(current.code);
  return (
    <div className="current">
      <h2>{city.name}</h2>
      <div className="current-main">
        <span className="current-icon" aria-hidden="true">{info.icon}</span>
        <div>
          <div className="current-temp">{formatTemp(current.temperature, unit)}</div>
          <div className="current-desc">{info.text}</div>
        </div>
      </div>
      <dl className="stats">
        <div>
          <dt>Độ ẩm</dt>
          <dd>{current.humidity}%</dd>
        </div>
        <div>
          <dt>Tốc độ gió</dt>
          <dd>{current.wind} km/h</dd>
        </div>
        <div>
          <dt>Cập nhật lúc</dt>
          <dd>{formatUpdateTime(current.time)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Forecast({ daily, unit }) {
  return (
    <div className="forecast">
      <h3>Dự báo 7 ngày</h3>
      <ul className="forecast-list">
        {daily.map((day) => {
          const { weekday, date } = formatDay(day.date);
          const info = describeWeather(day.code);
          return (
            <li key={day.date} className="forecast-item">
              <div className="forecast-day">
                <strong>{weekday}</strong>
                <span>{date}</span>
              </div>
              <span className="forecast-icon" title={info.text} aria-label={info.text}>{info.icon}</span>
              <div className="forecast-temp">
                <span className="max">{formatTemp(day.max, unit)}</span>
                <span className="min">{formatTemp(day.min, unit)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}