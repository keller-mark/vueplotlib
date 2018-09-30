import ContinuousScale from '../../src/scales/ContinuousScale';

test('able to create a ContinuousScale', () => {
    let scale = new ContinuousScale('exposure', 'Exposure', [0, 90000]);
    expect(scale.id).toBe("exposure");
    expect(scale.name).toBe("Exposure");
    expect(scale.domain.length).toBe(2);
    expect(scale.domainFiltered.length).toBe(2);
});

test('able to get a color from a ContinuousScale', () => {
    let scale = new ContinuousScale('exposure', 'Exposure', [0, 90000]);
    expect(scale.color(1000).substring(0, 3)).toBe("rgb");
});

test('able to compare two ContinuousScale domain values', () => {
    let scale = new ContinuousScale('exposure', 'Exposure', [0, 90000]);
    expect(scale.comparator(1000, 2000)).toBe(1);
    expect(scale.comparator(3000, 2000)).toBe(-1);
});

test('able to zoom a ContinuousScale', () => {
    let scale = new ContinuousScale('exposure', 'Exposure', [0, 90000]);
    expect(scale.domain[0]).toBe(0);
    expect(scale.domain[1]).toBe(90000);
    expect(scale.domainFiltered[0]).toBe(0);
    expect(scale.domainFiltered[1]).toBe(90000);
    scale.zoom(1000, 2000)
    expect(scale.domain[0]).toBe(0);
    expect(scale.domain[1]).toBe(90000);
    expect(scale.domainFiltered[0]).toBe(1000);
    expect(scale.domainFiltered[1]).toBe(2000);
});