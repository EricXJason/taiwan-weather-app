export interface WeatherApiResponse {
  success: string;
  result: WeatherApiResult;
  records: WeatherApiRecords;
}

export interface WeatherApiResult {
  resource_id: string;
  fields: WeatherApiField[];
}

export interface WeatherApiField {
  id: string;
  type: string;
}

export interface WeatherApiRecords {
  Locations: WeatherLocationGroup[];
}

export interface WeatherLocationGroup {
  DatasetDescription: string;
  LocationsName: string;
  Dataid: string;
  Location: DistrictLocation[];
}

export interface DistrictLocation {
  LocationName: string;
  Geocode: string;
  Latitude: string;
  Longitude: string;
  WeatherElement: WeatherElement[];
}

export interface WeatherElement {
  ElementName: string;
  Time: WeatherTimeSlot[];
}

export interface WeatherTimeSlot {
  DataTime?: string;
  ElementValue: WeatherElementValue[];
  StartTime?: string;
  EndTime?: string;
}

export interface WeatherElementValue {
  Temperature?: string;
  MaxTemperature?: string;
  MinTemperature?: string;
  DewPoint?: string;
  RelativeHumidity?: string;
  MaxApparentTemperature?: string;
  MinApparentTemperature?: string;
  MaxComfortIndex?: string;
  MaxComfortIndexDescription?: string;
  MinComfortIndex?: string;
  MinComfortIndexDescription?: string;
  BeaufortScale?: string;
  WindSpeed?: string;
  WindDirection?: string;
  ProbabilityOfPrecipitation?: string;
  Weather?: string;
  WeatherCode?: string;
  UVExposureLevel?: string;
  UVIndex?: string;
  WeatherDescription?: string;
}

export interface ProcessedTimeSlot {
  startTime: string;
  endTime: string;
  formattedTimeLabel: string;
  averageTemperature?: string;
  maxTemperature?: string;
  minTemperature?: string;
  dewPoint?: string;
  relativeHumidity?: string;
  maxApparentTemperature?: string;
  minApparentTemperature?: string;
  maxComfortIndex?: string;
  maxComfortIndexDescription?: string;
  minComfortIndex?: string;
  minComfortIndexDescription?: string;
  beaufortScale?: string;
  windSpeed?: string;
  windDirection?: string;
  pop12h?: string;
  weather?: string;
  weatherCode?: string;
  uvExposureLevel?: string;
  uvIndex?: string;
  weatherDescription?: string;
}

export type WeatherBackgroundType = 'sunny' | 'cloudy' | 'rain';
