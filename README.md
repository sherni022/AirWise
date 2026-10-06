# AirWise

Smart Indoor Environmental Quality Monitoring and Recommendation System.

## Prototype
Arduino UNO + DHT11 + LDR.

- DHT11: temperature and humidity
- LDR: relative light intensity (raw analog value)
- Arduino UNO: sensor controller
- Web dashboard: live readings, prototype score and recommendations

## Hardware wiring
DHT11:
- S -> D2
- + -> 5V
- - -> GND

LDR voltage divider:
- 5V -> LDR -> junction -> A0
- 10kΩ resistor from junction -> GND

## Run the website
The live Arduino connection uses the Web Serial API, so use Google Chrome or Microsoft Edge and serve the site from HTTPS (for example, GitHub Pages) or localhost.

For a presentation fallback, the dashboard also includes Demo / Manual Test.

## Score
Initial prototype rule-based score:
- Start at 100
- Temperature > 32°C: -20
- Temperature 30–32°C: -10
- Humidity > 70%: -20
- Humidity 60–70%: -10
- Light < 300 raw units: -5
- 80+ GOOD, 60–79 MODERATE, below 60 POOR

These rules are prototype assumptions and are not a validated medical or air-quality standard.

## Important scientific framing
The current prototype does not directly measure pollutants or CO₂. Light is treated as an additional indoor environmental/comfort parameter, not as a direct measure of air quality.
