/**
 * src/services/locationService.ts
 *
 * Location and permissions service abstraction.
 * Handles acquiring device GPS coordinates, checking/requesting location permissions,
 * and provides test hooks for simulating permission denial and mock positions.
 */

export class LocationPermissionDeniedError extends Error {
  constructor(message: string = 'Location permission was denied.') {
    super(message);
    this.name = 'LocationPermissionDeniedError';
  }
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class LocationService {
  private mockPermission: LocationPermissionStatus | null = null;
  private mockCoords: Coordinates | null = null;

  /**
   * Set simulated permission status for testing or preview debug screens.
   */
  setMockPermission(status: LocationPermissionStatus | null): void {
    this.mockPermission = status;
  }

  /**
   * Set simulated coordinates for testing or preview debug screens.
   */
  setMockCoordinates(coords: Coordinates | null): void {
    this.mockCoords = coords;
  }

  /**
   * Check current location permission status.
   */
  async getPermissionStatus(): Promise<LocationPermissionStatus> {
    if (this.mockPermission !== null) {
      return this.mockPermission;
    }

    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });
        if (permission.state === 'granted') return 'granted';
        if (permission.state === 'denied') return 'denied';
        return 'undetermined';
      } catch {
        // Fall through to geolocation check
      }
    }

    // Default to undetermined if unknown
    return 'undetermined';
  }

  /**
   * Request location permission from the device/browser.
   */
  async requestPermission(): Promise<'granted' | 'denied'> {
    if (this.mockPermission !== null) {
      return this.mockPermission === 'granted' ? 'granted' : 'denied';
    }

    const current = await this.getPermissionStatus();
    if (current === 'granted') return 'granted';
    if (current === 'denied') return 'denied';

    // Try a one-shot position request to trigger OS/browser permission prompt
    try {
      await this.getCurrentPosition();
      return 'granted';
    } catch (err) {
      if (err instanceof LocationPermissionDeniedError) {
        return 'denied';
      }
      return 'denied';
    }
  }

  /**
   * Retrieve current coordinates. Throws LocationPermissionDeniedError if denied.
   */
  async getCurrentPosition(): Promise<Coordinates> {
    if (this.mockPermission === 'denied') {
      throw new LocationPermissionDeniedError();
    }

    if (this.mockCoords) {
      return this.mockCoords;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      return new Promise<Coordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: Number(pos.coords.latitude.toFixed(4)),
              longitude: Number(pos.coords.longitude.toFixed(4)),
            });
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              reject(new LocationPermissionDeniedError());
            } else {
              reject(new Error(`Geolocation error: ${err.message}`));
            }
          },
          { timeout: 10_000, enableHighAccuracy: false },
        );
      });
    }

    // If geolocation is completely unavailable in the environment
    throw new LocationPermissionDeniedError(
      'Geolocation is not supported in this runtime environment.',
    );
  }
}

/** Global singleton instance */
export const locationService = new LocationService();
