import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  private readonly httpClient = inject(HttpClient);

  getApi<T = unknown>(url: string): Observable<T> {
    return this.httpClient.get<T>(url);
  }

  postApi<T = unknown>(url: string, data: unknown): Observable<T> {
    return this.httpClient.post<T>(url, data);
  }
}
