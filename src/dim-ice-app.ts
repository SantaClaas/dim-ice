import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type AccessToken = string;
type Scope = string;
type UnixTimestampInSeconds = number;

type AccessTokenResponse = {
  access_token: AccessToken;
  token_type: 'Bearer';
  scope: Scope;
  create_at: UnixTimestampInSeconds;
};

type Status = {
  id: string;
  content: string;
};

const logo = new URL('../../assets/logo.svg', import.meta.url).href;

// I know, lol
const clientSecret = '51Nwi4I83gxxgsqfPWZQLALHlIJgEjlIIh9o_Zdvh10';
const clientId = 'NgtasltAXdbQgao8vU5H1pTLEBX1EGvuNThYYpUhoxA';

const redirectUri = new URL('/redirect', location.href);

console.log(redirectUri.toString());

//TODO make instance user-configurable
const instance = 'mastodon.social';

// Create urls
const base = new URL(`https://${instance}/`);
const authorizationUrl = new URL('/oauth/authorize', base);
authorizationUrl.searchParams.set('client_id', clientId);
authorizationUrl.searchParams.set('scope', 'read');
// authorizationUrl.searchParams.set("redirect_uri", "urn:ietf:wg:oauth:2.0:oob");
//TODO make redirect url current app url
authorizationUrl.searchParams.set('redirect_uri', redirectUri.toString());
authorizationUrl.searchParams.set('response_type', 'code');

async function exchangeForToken(
  authorizationCode: string
): Promise<AccessTokenResponse> {
  const url = new URL('/oauth/token', base);
  //TODO create type definition
  const content = {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code: authorizationCode,
    scope: 'read',
  };

  //TODO error handling
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });

  //TODO handle not ok case

  return (await response.json()) as AccessTokenResponse;
}

// Returns the stati posted to the home timeline
async function getHomeTimeline(token: AccessToken) {
  const url = new URL('/api/v1/timelines/home', base);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return (await response.json()) as Array<Status>;
}

function isLocalStorageSupported() {
  return 'localStorage' in window;
}

type TryResult<TValue> =
  | [isValid: false, value: null]
  | [isValid: true, value: TValue];

function tryLoadAccessToken(): TryResult<AccessTokenResponse> {
  // Can happen in incognito window
  if (!isLocalStorageSupported()) return [false, null];

  const accessTokenValue = localStorage.getItem('accessTokenResponse');

  if (!accessTokenValue) return [false, null];
  const accessToken = JSON.parse(accessTokenValue) as AccessTokenResponse;

  if (
    'access_token' in accessToken &&
    typeof accessToken.access_token === 'string'
  )
    return [true, accessToken];

  return [false, null];
}

function trySaveAccessToken(accessToken: AccessTokenResponse): boolean {
  // Can happen in incognito window
  if (!isLocalStorageSupported()) return false;

  const value = JSON.stringify(accessToken);
  localStorage.setItem('accessTokenResponse', value);
  return true;
}

@customElement('dim-ice-app')
export class DimIceApp extends LitElement {
  @state() _accessToken: AccessTokenResponse | null = null;

  @state() _isAuthenticated: boolean = false;

  @state() _isExchangingToken: boolean = false;

  @state() _homeTimeline: Status[] | null = null;

  @state() _isGettingHomeTimeline: boolean = false;

  #startLoadTimeline(accessToken: AccessToken) {
    this._isGettingHomeTimeline = true;
    getHomeTimeline(accessToken)
      .then(timeline => {
        this._homeTimeline = timeline;
      })
      .catch(error => {
        console.error(error, 'Could not load home time line data');
      })
      .finally(() => {
        this._isGettingHomeTimeline = false;
      });
  }

  #startExchange() {
    // Get token from query parameter
    const query = new URLSearchParams(location.search);
    const code = query.get('code');
    // Remove code so we don't trigger another exchange

    const newLocation = new URL(location.href);
    newLocation.search = '';
    newLocation.pathname = '';
    history.replaceState({}, '', newLocation.href);

    if (code === null) {
      console.warn('Expected code in query');
      return;
    }

    // Start token exchange
    this._isExchangingToken = true;
    exchangeForToken(code)
      .then(response => {
        this._accessToken = response;
        this._isExchangingToken = false;
        if (!trySaveAccessToken(response)) {
          console.warn(
            'Could not persist access token. Are you in a private browser session?'
          );
        }
        this.#startLoadTimeline(response.access_token);
        return response;
      })
      .catch(error => {
        console.error(error, 'Could not exchange token');
        this._isExchangingToken = false;
      });
  }

  constructor() {
    super();

    if (location.pathname === '/redirect') {
      // We are currently in the authorization flow when the app was opened with "/redirect"
      // Assume we have the code in the query
      this.#startExchange();
      // We don't need to get the token from local storage since we are exchanging for a new one
      return;
    }

    const [isValid, accessToken] = tryLoadAccessToken();
    if (!isValid) {
      return;
    }

    this._isAuthenticated = true;
    this._accessToken = accessToken;
    this.#startLoadTimeline(this._accessToken.access_token);
  }

  @state() _serverInstance: string = '';

  static styles = css``;

  private static createListItem(status: Status) {
    return html`
      <li>
        <p>${status.id}</p>
        <p>${status.content}</p>
      </li>
    `;
  }

  #getContent() {
    if (this._isExchangingToken) return html`<p>Exchaning token</p>`;

    if (this._isGettingHomeTimeline) return html`<p>Getting home timeline</p>`;

    if (this._homeTimeline)
      return html`
        <ul>
          ${this._homeTimeline.map(DimIceApp.createListItem)}
        </ul>
      `;

    return html`
      <img alt="dim ice logo" src=${logo} />
      <h1>Dim Ice</h1>

      <input id="instance" .value=${this._serverInstance} />
      <a class="app-link" href="${authorizationUrl.href}"> Authorize </a>
    `;
  }

  render() {
    const content = this.#getContent();

    return html` <main>${content}</main> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dim-ice-app': DimIceApp;
  }
}
