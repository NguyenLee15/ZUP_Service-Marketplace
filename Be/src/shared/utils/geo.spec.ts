import { calculateHaversineDistance } from './geo';

describe('Geo Utility', () => {
  it('should calculate correct distance between District 1 and District 7 in HCMC', () => {
    // Tọa độ Quận 1 (Bến Thành): 10.7725, 106.6980
    // Tọa độ Quận 7 (Phú Mỹ Hưng): 10.7289, 106.7218
    const distance = calculateHaversineDistance(10.7725, 106.6980, 10.7289, 106.7218);
    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(6); // Khoảng cách thực tế khoảng ~5.4 km
  });

  it('should return 0 for the same coordinates', () => {
    const distance = calculateHaversineDistance(10.7725, 106.6980, 10.7725, 106.6980);
    expect(distance).toBe(0);
  });
});
