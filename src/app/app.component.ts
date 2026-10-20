import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WeatherDataService } from './@services/weather-data.service';
import { TaiwanMapComponent } from './taiwan-map/taiwan-map.component';
import { ParticleSystem } from './particles';
import { WeatherBackgroundType } from './@interfaces/weather.interface';

@Component({
  selector: 'app-root',
  imports: [FormsModule, TaiwanMapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly weatherDataService = inject(WeatherDataService);

  @ViewChild('bgParticles') canvasRef!: ElementRef<HTMLCanvasElement>;

  protected readonly counties: string[] = Object.keys(
    this.weatherDataService.countyCodeMap,
  );

  protected selectedCounty: string = this.counties[0];
  protected selectedDistrict: string = '';
  protected selectedFutureIndex: number = 0;
  protected currentWeatherBackground: WeatherBackgroundType = 'sunny';

  private particleSystem: ParticleSystem | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string = '';

  public ngOnInit(): void {
    this.restoreSavedLocation();
    this.onCountyChange();
  }

  public ngAfterViewInit(): void {
    if (this.canvasRef?.nativeElement) {
      this.particleSystem = new ParticleSystem(this.canvasRef.nativeElement);
    }

    this.destroyRef.onDestroy(() => {
      this.particleSystem?.destroy();
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
    });
  }

  protected onCountyChange(): void {
    this.weatherDataService.setDistricts(this.selectedCounty, () => {
      if (this.weatherDataService.districts.length === 0) {
        return;
      }

      const hasDistrict = this.weatherDataService.districts.some(
        (district) => district.LocationName === this.selectedDistrict,
      );

      if (!hasDistrict) {
        this.selectedDistrict = this.weatherDataService.districts[0].LocationName;
      }

      this.onDistrictChange();
      this.currentWeatherBackground = this.weatherDataService.currentWeatherBackground;
      this.playWeatherSound();

      sessionStorage.setItem('selectedCounty', this.selectedCounty);
    });
  }

  protected onDistrictChange(): void {
    this.selectedFutureIndex = 0;
    this.weatherDataService.setDistrictWeatherData(this.selectedDistrict);
    this.currentWeatherBackground = this.weatherDataService.currentWeatherBackground;

    if (this.selectedDistrict) {
      sessionStorage.setItem('selectedDistrict', this.selectedDistrict);
    }
  }

  protected refreshData(): void {
    this.weatherDataService.setDistricts(this.selectedCounty, () => {
      this.onDistrictChange();
    });
  }

  protected selectFutureTimeSlot(index: number): void {
    this.selectedFutureIndex = index;
  }

  private restoreSavedLocation(): void {
    const savedCounty = sessionStorage.getItem('selectedCounty');
    const savedDistrict = sessionStorage.getItem('selectedDistrict');

    if (savedCounty && this.counties.includes(savedCounty)) {
      this.selectedCounty = savedCounty;
    }

    if (savedDistrict) {
      this.selectedDistrict = savedDistrict;
    }
  }

  private playWeatherSound(): void {
    let soundUrl = '';
    if (this.currentWeatherBackground === 'sunny') {
      soundUrl =
        'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/forest.mp3';
    } else if (this.currentWeatherBackground === 'rain') {
      soundUrl =
        'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/rain.mp3';
    } else {
      soundUrl =
        'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/wind.mp3';
    }

    if (this.currentAudioUrl === soundUrl) {
      return;
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    this.currentAudioUrl = soundUrl;
    const audio = new Audio(soundUrl);
    audio.loop = true;
    audio.volume = 0.1;
    this.currentAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const startPlay = () => {
          if (this.currentAudio === audio) {
            audio.play().catch(() => { });
          }
          window.removeEventListener('click', startPlay);
        };
        window.addEventListener('click', startPlay);
      });
    }
  }
}
