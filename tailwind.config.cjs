module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"] ,
  theme: {
    extend: {
      colors: {
        cream: '#f7efe2',
        parchment: '#efe0c8',
        vintageBrown: '#6b4c3b',
        forestGreen: '#2f6b4a',
        ink: '#2b2b2b'
      },
      borderRadius: {
        xl: '20px',
        '2xl': '24px'
      }
    }
  },
  plugins: []
}
