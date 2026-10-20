import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Topology, GeometryCollection } from 'topojson-specification';

interface CountyProperties {
  COUNTYID: string;
  COUNTYCODE: string;
  COUNTYNAME: string;
  COUNTYENG: string;
}

const COUNTY_NAME_MAP: Record<string, string> = {
  台北市: '臺北市',
  台中市: '臺中市',
  台南市: '臺南市',
  台東縣: '臺東縣',
  新北市: '新北市',
  桃園市: '桃園市',
  基隆市: '基隆市',
  新竹市: '新竹市',
  新竹縣: '新竹縣',
  宜蘭縣: '宜蘭縣',
  苗栗縣: '苗栗縣',
  彰化縣: '彰化縣',
  南投縣: '南投縣',
  雲林縣: '雲林縣',
  嘉義市: '嘉義市',
  嘉義縣: '嘉義縣',
  屏東縣: '屏東縣',
  高雄市: '高雄市',
  花蓮縣: '花蓮縣',
  澎湖縣: '澎湖縣',
  金門縣: '金門縣',
  連江縣: '連江縣',
};

const SUPPORTED_COUNTIES = new Set([
  '臺北市', '臺中市', '臺南市', '臺東縣', '新北市',
  '桃園市', '基隆市', '新竹市', '新竹縣', '宜蘭縣',
  '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義市',
  '嘉義縣', '屏東縣', '高雄市', '花蓮縣', '澎湖縣',
  '連江縣', '金門縣'
]);

@Component({
  selector: 'app-taiwan-map',
  imports: [CommonModule],
  templateUrl: './taiwan-map.component.html',
  styleUrl: './taiwan-map.component.scss',
})
export class TaiwanMapComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @ViewChild('mapContainer') mapContainer!: ElementRef<SVGSVGElement>;
  @Output() countySelected = new EventEmitter<string>();
  @Input() selectedCounty: string = '';

  private resizeObserver: ResizeObserver | null = null;
  private mapLoaded = false;
  private cachedTopoData: Topology<{ counties: GeometryCollection<CountyProperties> }> | null = null;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.loadMap();
    this.resizeObserver = new ResizeObserver(() => {
      this.loadMap();
    });
    this.resizeObserver.observe(
      this.mapContainer.nativeElement.parentElement!
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCounty'] && this.mapLoaded) {
      this.updateSelection();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onMouseMove(event: MouseEvent): void {
    const wrapper = event.currentTarget as HTMLElement;
    const rect = wrapper.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const svg = this.mapContainer.nativeElement;
    svg.style.transformOrigin = `${x}% ${y}%`;
  }

  onMouseLeave(): void {
    const svg = this.mapContainer.nativeElement;
    svg.style.transformOrigin = 'center center';
  }

  private async loadMap(): Promise<void> {
    const container = this.mapContainer.nativeElement;
    const parent = container.parentElement!;
    const width = Math.max(parent.clientWidth || 320, 180);
    const height = width * 1.5;

    container.setAttribute('viewBox', `0 0 ${width} ${height}`);
    container.setAttribute('width', String(width));
    container.setAttribute('height', String(height));

    d3.select(container).selectAll('*').remove();

    try {
      if (!this.cachedTopoData) {
        this.cachedTopoData = (await d3.json(
          'taiwan-counties.topo.json'
        )) as Topology<{ counties: GeometryCollection<CountyProperties> }>;
      }
      const topoData = this.cachedTopoData;

      const geojson = topojson.feature(topoData, topoData.objects['counties']);

      const mainIslandFeatures = (geojson as any).features.filter((f: any) => {
        const rawName = f.properties?.COUNTYNAME || '';
        const mappedName = COUNTY_NAME_MAP[rawName] || rawName;
        return mappedName !== '金門縣' && mappedName !== '連江縣' && mappedName !== '澎湖縣';
      });

      const mainIslandGeojson = {
        type: 'FeatureCollection',
        features: mainIslandFeatures
      };

      const projection = d3
        .geoMercator()
        .fitSize([width, height], mainIslandGeojson as any);

      const pathGenerator = d3.geoPath().projection(projection);
      const svgSel = d3.select(container);

      svgSel
        .selectAll<SVGPathElement, any>('path')
        .data(mainIslandFeatures)
        .join('path')
        .attr('d', (d: any) => pathGenerator(d) || '')
        .attr('class', (d: any) => {
          const rawName = d.properties?.COUNTYNAME || '';
          const mappedName = COUNTY_NAME_MAP[rawName] || rawName;
          const isSupported = SUPPORTED_COUNTIES.has(mappedName);
          const isSelected = mappedName === this.selectedCounty;
          let cls = 'county-path';
          if (!isSupported) cls += ' county-unsupported';
          if (isSelected) cls += ' selected';
          return cls;
        })
        .attr('data-county', (d: any) => {
          const name = d.properties?.COUNTYNAME || '';
          return COUNTY_NAME_MAP[name] || name;
        })
        .on('mouseenter', (event: MouseEvent) => {
          const el = event.currentTarget as Element;
          if (!el.classList.contains('county-unsupported')) {
            d3.select(el).classed('hovered', true);
          }
        })
        .on('mouseleave', (event: MouseEvent) => {
          d3.select(event.currentTarget as Element).classed('hovered', false);
        })
        .on('click', (event: MouseEvent, d: any) => {
          event.stopPropagation();
          const name = d.properties?.COUNTYNAME || '';
          const mappedName = COUNTY_NAME_MAP[name] || name;
          if (SUPPORTED_COUNTIES.has(mappedName)) {
            this.zone.run(() => {
              this.countySelected.emit(mappedName);
            });
          }
        });

      this.mapLoaded = true;
    } catch (error) {
      console.error(error);
    }
  }

  updateSelection(): void {
    if (!this.mapContainer?.nativeElement) return;
    d3.select(this.mapContainer.nativeElement)
      .selectAll<SVGPathElement, any>('.county-path')
      .attr('class', (d: any) => {
        const rawName = d.properties?.COUNTYNAME || '';
        const mappedName = COUNTY_NAME_MAP[rawName] || rawName;
        const isSupported = SUPPORTED_COUNTIES.has(mappedName);
        const isSelected = mappedName === this.selectedCounty;
        let cls = 'county-path';
        if (!isSupported) cls += ' county-unsupported';
        if (isSelected) cls += ' selected';
        return cls;
      });
  }
}
