import React, { useState, useEffect } from 'react';

function App() {
  const [spaceData, setSpaceData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('Detecting Location...');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    fetch('/api/apod')
      .then((res) => res.json())
      .then((json) => {
        const isImage = json.media_type === 'image';
        const fallbackImage = 'https://images-assets.nasa.gov/image/PIA04921/PIA04921~orig.jpg';
        
        const rawUrl = isImage ? (json.hdurl || json.url) : fallbackImage;
        const secureUrl = rawUrl.replace('http://', 'https://');
        
        setSpaceData({ ...json, displayUrl: secureUrl });
      })
      .catch((err) => console.error("NASA Link Failure:", err));

    const fetchWeather = (lat, lon) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`)
        .then((res) => res.json())
        .then((json) => {
          setWeather(json.current_weather);
          // Reverse geocode to get city name
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(res => res.json())
            .then(geo => {
              const cityName = geo.address.city || geo.address.town || geo.address.village || geo.display_name.split(',')[0];
              setCity(cityName);
            })
            .catch(() => setCity('Unknown Location'));
        })
        .catch((err) => console.error("Weather Link Failure:", err));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
        () => { setCity('London'); fetchWeather(51.5074, -0.1278); } // Fallback to London
      );
    } else {
      setCity('London');
      fetchWeather(51.5074, -0.1278);
    }

    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!spaceData) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-blue-500 font-mono animate-pulse tracking-widest">
          ESTABLISHING SECURE SATELLITE UPLINK...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col justify-between p-6 md:p-12 transition-all duration-1000"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${spaceData.displayUrl})`,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* --- TOP SECTION: CLOCK & WEATHER --- */}
      <header className="flex justify-between items-start animate-fade-in">
        <div className="bg-black/30 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-6xl font-extralight tracking-tighter text-white">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-blue-400 uppercase tracking-[0.3em] text-[10px] mt-2 font-bold">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {weather && (
          <div className="bg-black/30 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl text-right">
            <p className="text-4xl font-bold text-white">{Math.round(weather.temperature)}°F</p>
            <p className="text-blue-300 text-xs uppercase tracking-widest mt-1">{city}</p>
            
            <form 
              action="https://www.google.com/search" 
              method="GET"
              className="mt-6 w-64 ml-auto"
            >
              <div className="relative group">
                <input 
                  type="text" 
                  name="q" 
                  placeholder="Search..." 
                  autoComplete="off"
                  className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-2xl group-hover:bg-white/15"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </header>

      {/* --- BOTTOM SECTION: NASA INFO --- */}
      <footer className="max-w-2xl animate-fade-in-up">
        <div className="bg-black/30 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">NASA Image of the Day</h2>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3 leading-tight">{spaceData.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed max-h-10 hover:max-h-[500px] overflow-hidden transition-[max-height] duration-700 ease-in-out cursor-help">
            {spaceData.explanation}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;