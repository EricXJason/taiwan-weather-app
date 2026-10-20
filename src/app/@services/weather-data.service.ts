import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClientService } from './http-client.service';
import {
  ProcessedTimeSlot,
  WeatherApiResponse,
  DistrictLocation,
  WeatherElementValue,
  WeatherBackgroundType,
} from '../@interfaces/weather.interface';

@Injectable({
  providedIn: 'root',
})
export class WeatherDataService {
  private readonly httpClientService = inject(HttpClientService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly apiAuthorization = 'CWA-B30AA307-89B6-4DF6-9E2C-59BE9567023F';
  private readonly apiBaseUrl = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';

  public currentTime: string = '';
  public districts: DistrictLocation[] = [];
  public currentWeather: ProcessedTimeSlot | null = null;
  public currentWeatherBackground: WeatherBackgroundType = 'sunny';
  public futureWeatherList: ProcessedTimeSlot[] = [];

  public readonly countyCodeMap: Readonly<Record<string, string>> = {
    基隆市: 'F-D0047-051',
    臺北市: 'F-D0047-063',
    新北市: 'F-D0047-071',
    桃園市: 'F-D0047-007',
    新竹市: 'F-D0047-055',
    新竹縣: 'F-D0047-011',
    宜蘭縣: 'F-D0047-003',
    苗栗縣: 'F-D0047-015',
    臺中市: 'F-D0047-075',
    彰化縣: 'F-D0047-019',
    南投縣: 'F-D0047-023',
    雲林縣: 'F-D0047-027',
    嘉義市: 'F-D0047-059',
    嘉義縣: 'F-D0047-031',
    臺南市: 'F-D0047-079',
    高雄市: 'F-D0047-067',
    屏東縣: 'F-D0047-035',
    臺東縣: 'F-D0047-039',
    澎湖縣: 'F-D0047-047',
    連江縣: 'F-D0047-083',
    金門縣: 'F-D0047-087',
    花蓮縣: 'F-D0047-043',
  };

  public getApiUrl(dataId: string): string {
    return `${this.apiBaseUrl}/${dataId}?Authorization=${this.apiAuthorization}&format=JSON`;
  }

  public setDistricts(countyName: string, onComplete?: () => void): void {
    const code = this.countyCodeMap[countyName];
    if (!code) {
      return;
    }

    const url = this.getApiUrl(code);

    this.httpClientService
      .getApi<WeatherApiResponse>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.districts = res?.records?.Locations?.[0]?.Location ?? [];
          this.currentTime = this.setCurrentTime();
          if (onComplete) {
            onComplete();
          }
        },
        error: (err) => {
          console.error('Failed to fetch weather data:', err);
        },
      });
  }

  public setDistrictWeatherData(districtName: string): void {
    const targetDistrict = this.districts.find(
      (item) => item.LocationName === districtName,
    );

    if (!targetDistrict) {
      return;
    }

    const timeSlotList: ProcessedTimeSlot[] = [];

    for (const element of targetDistrict.WeatherElement) {
      for (const time of element.Time) {
        const startTime: string = time.StartTime ?? '';
        let currentSlot = timeSlotList.find((slot) => slot.startTime === startTime);

        if (!currentSlot) {
          currentSlot = {
            startTime,
            endTime: time.EndTime ?? '',
            formattedTimeLabel: this.formatTimeString(startTime),
          };
          timeSlotList.push(currentSlot);
        }

        const elementValue: WeatherElementValue = time.ElementValue?.[0] ?? {};

        switch (element.ElementName) {
          case '平均溫度':
            currentSlot.averageTemperature = elementValue.Temperature;
            break;
          case '最高溫度':
            currentSlot.maxTemperature = elementValue.MaxTemperature;
            break;
          case '最低溫度':
            currentSlot.minTemperature = elementValue.MinTemperature;
            break;
          case '平均露點溫度':
            currentSlot.dewPoint = elementValue.DewPoint;
            break;
          case '平均相對濕度':
            currentSlot.relativeHumidity = elementValue.RelativeHumidity;
            break;
          case '最高體感溫度':
            currentSlot.maxApparentTemperature = elementValue.MaxApparentTemperature;
            break;
          case '最低體感溫度':
            currentSlot.minApparentTemperature = elementValue.MinApparentTemperature;
            break;
          case '最大舒適度指數':
            currentSlot.maxComfortIndex = elementValue.MaxComfortIndex;
            currentSlot.maxComfortIndexDescription = elementValue.MaxComfortIndexDescription;
            break;
          case '最小舒適度指數':
            currentSlot.minComfortIndex = elementValue.MinComfortIndex;
            currentSlot.minComfortIndexDescription = elementValue.MinComfortIndexDescription;
            break;
          case '風速':
            currentSlot.beaufortScale = elementValue.BeaufortScale;
            currentSlot.windSpeed = elementValue.WindSpeed;
            break;
          case '風向':
            currentSlot.windDirection = elementValue.WindDirection;
            break;
          case '12小時降雨機率':
            currentSlot.pop12h = elementValue.ProbabilityOfPrecipitation;
            break;
          case '天氣現象':
            currentSlot.weather = elementValue.Weather;
            currentSlot.weatherCode = elementValue.WeatherCode;
            break;
          case '紫外線指數':
            currentSlot.uvExposureLevel = elementValue.UVExposureLevel;
            currentSlot.uvIndex = elementValue.UVIndex;
            break;
          case '天氣預報綜合描述':
            currentSlot.weatherDescription = elementValue.WeatherDescription;
            break;
        }
      }
    }

    const sortedList = timeSlotList.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    this.currentWeather = sortedList[0] ?? null;
    this.futureWeatherList = sortedList.slice(1);

    if (!this.currentWeather?.weatherCode) {
      this.currentWeatherBackground = 'sunny';
    } else {
      const weatherCode = Number(this.currentWeather.weatherCode);
      if (weatherCode === 1) {
        this.currentWeatherBackground = 'sunny';
      } else if (weatherCode >= 2 && weatherCode < 8) {
        this.currentWeatherBackground = 'cloudy';
      } else {
        this.currentWeatherBackground = 'rain';
      }
    }
  }

  private formatTimeString(isoCode: string): string {
    const date = new Date(isoCode);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    const period = hours >= 6 && hours < 18 ? '白天 06:00 ~ 18:00' : '晚上 18:00 ~ 06:00';

    return `${month}/${day} (${weekday}) ${period}`;
  }

  private setCurrentTime(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${month}/${day} ${hours}:${minutes}:${seconds}`;
  }
}
