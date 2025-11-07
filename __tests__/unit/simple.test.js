// Simple test to verify Jest setup
describe('KITMED Testing Setup', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2)
  })

  test('Testing environment is configured', () => {
    expect(typeof window).toBeDefined()
    expect(typeof document).toBeDefined()
  })

  test('KITMED project constants', () => {
    const brandColors = {
      blue: '#1C75BC',
      red: '#ED1C24'
    }
    
    expect(brandColors.blue).toBe('#1C75BC')
    expect(brandColors.red).toBe('#ED1C24')
  })
})