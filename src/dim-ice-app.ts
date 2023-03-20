import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

type AccessToken = string;
type Scope = string;
type UnixTimestampInSeconds = number;

type AccessTokenResponse = {
  access_token: AccessToken;
  token_type: 'Bearer';
  scope: Scope;
  create_at: UnixTimestampInSeconds;
};

const logo = new URL('../../assets/logo.svg', import.meta.url).href;

// I know, lol
const clientSecret = '51Nwi4I83gxxgsqfPWZQLALHlIJgEjlIIh9o_Zdvh10';
const clientId = 'NgtasltAXdbQgao8vU5H1pTLEBX1EGvuNThYYpUhoxA';

const redirectUri = new URL('/redirect', location.href);

//TODO make instance user-configurable
const instance = 'mastodon.social';

// Create urla
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

  return (await response.json()) as AccessTokenResponse;
}

async function getHomeTimeline(token: AccessToken) {
  const url = new URL('/api/v1/timelines/home', base);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

@customElement('dim-ice-app')
export class DimIceApp extends LitElement {
  #code: string | undefined | null;

  constructor() {
    super();

    if (location.pathname === '/redirect') {
      // We are currently in the authorization flow when the app was opened with "/redirect"
      // Assume we have the code in the query

      const query = new URLSearchParams(location.search);
      this.#code = query.get('code');

      if (this.#code === null) {
        console.warn('Expected code in query');
      }

      // Start token exchange
      // obtainToken(this.#code).catch(console.error);
    }
  }

  @property({ type: String }) header = 'My app';

  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      font-size: calc(10px + 2vmin);
      color: #1a2b42;
      max-width: 960px;
      margin: 0 auto;
      text-align: center;
      background-color: var(--dim-ice-app-background-color);
    }

    main {
      flex-grow: 1;
    }

    .logo {
      margin-top: 36px;
      animation: app-logo-spin infinite 20s linear;
    }

    @keyframes app-logo-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .app-footer {
      font-size: calc(12px + 0.5vmin);
      align-items: center;
    }

    .app-footer a {
      margin-left: 5px;
    }
  `;

  async exchange() {
    if (this.#code === null || this.#code === undefined) {
      console.error('ooops');
      return;
    }

    const response = await exchangeForToken(this.#code);

    const timelines = await getHomeTimeline(response.access_token);

    console.log(timelines);
  }

  render() {
    return html`
      <main>
        <div class="logo"><img alt="dim ice logo" src=${logo} /></div>
        <h1>${this.header}</h1>

        <p>Edit <code>src/DimIceApp.ts</code> and save to reload.</p>
        <a
          class="app-link"
          href="${authorizationUrl.toString()}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Authorize
        </a>

        <button @click=${this.exchange}>Exchange</button>
      </main>

      <p class="app-footer">
        🚽 Made with love by
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/open-wc"
          >open-wc</a
        >.
      </p>
    `;
  }
}
