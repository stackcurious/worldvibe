import React, { useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

function VolumeControl() {
  const [volume, setVolume] = useState(30);

  const handleChange = (value) => {
    setVolume(value);
  };

  return (
    <div style={{ width: 400, margin: '0 auto' }}>
      <Slider
        min={0}
        max={100}
        value={volume}
        onChange={handleChange}
        railStyle={{ backgroundColor: '#ddd', height: 10 }}
        handleStyle={{
          borderColor: '#888',
          height: 24,
          width: 24,
          marginLeft: -14,
          marginTop: -7,
          backgroundColor: '#fff',
        }}
        trackStyle={{ backgroundColor: '#555', height: 10 }}
      />
      <div style={{ textAlign: 'center', marginTop: 10 }}>Volume: {volume}%</div>
    </div>
  );
}

export default VolumeControl;
