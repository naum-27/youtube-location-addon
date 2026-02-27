console.log('--- GEO ADDON STARTING ---');

const API_ENDPOINT = new URL('https://youtube-location-addon.vercel.app/api/guess');
console.log('Targeting URL:', API_ENDPOINT.toString());

function removeOldBadge() {
    const oldBadge = document.getElementById('yt-geo-location-v2');
    if (oldBadge) {
        oldBadge.remove();
        console.log('Old badge removed.');
    }
}

async function fetchLocation(title, description) {
    console.log('Fetching location for:', title);
    try {
        const response = await fetch(API_ENDPOINT.toString(), {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description }),
        });

        if (!response.ok) {
            console.log('Fetch failed with status:', response.status);
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response received:', data);
        return data;
    } catch (error) {
        console.error('Error fetching location:', error);
        return { error: error.message };
    }
}

function injectBadge(locationData, fallback = false) {
    console.log(`Injecting badge (fallback: ${fallback})...`);
    removeOldBadge();

    const badge = document.createElement('div');
    badge.id = 'yt-geo-location-v2';

    if (locationData.error) {
        badge.innerText = `❌ API Error: ${locationData.error}`;
        badge.style.setProperty('background-color', '#cc0000', 'important');
    } else {
        badge.innerText = `📍 ${locationData.city ? locationData.city + ', ' : ''}${locationData.country || 'Unknown'}`;
    }

    if (fallback) {
        badge.style.setProperty('position', 'fixed', 'important');
        badge.style.setProperty('top', '10px', 'important');
        badge.style.setProperty('left', '50%', 'important');
        badge.style.setProperty('transform', 'translateX(-50%)', 'important');
        badge.style.setProperty('z-index', '10000', 'important');
        document.body.appendChild(badge);
    } else {
        const titleElement = document.querySelector('h1.ytd-watch-metadata');
        if (titleElement) {
            titleElement.parentElement.insertBefore(badge, titleElement.nextSibling);
            console.log('Badge injected into YouTube header.');
        }
    }
}

function injectDebugButton() {
    if (document.getElementById('yt-geo-debug-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'yt-geo-debug-btn';
    btn.innerText = '📍 Trigger Geo-Check';

    btn.addEventListener('click', async () => {
        console.log('Manual trigger clicked!');
        const titleElement = document.querySelector('h1.ytd-watch-metadata');
        const titleText = titleElement?.innerText?.trim() || document.title.replace(' - YouTube', '');
        const description = document.querySelector('#description-inline-expander')?.innerText || 'Manual Check';

        console.log('Sending to API:', { title: titleText, description });
        const locationData = await fetchLocation(titleText, description);
        injectBadge(locationData, !titleElement);
    });

    document.body.appendChild(btn);
    console.log('Debug button injected at top of page.');
}

async function handleNavigation() {
    injectDebugButton();
    console.log('Navigation event/initial run triggered.');
    let attempts = 0;
    const maxAttempts = 10;

    const poller = setInterval(async () => {
        attempts++;
        const titleElement = document.querySelector('h1.ytd-watch-metadata');
        const titleText = titleElement?.innerText?.trim();

        if (titleElement && titleText) {
            clearInterval(poller);
            const description = document.querySelector('#description-inline-expander')?.innerText || '';
            const locationData = await fetchLocation(titleText, description);
            injectBadge(locationData);
        } else if (attempts >= maxAttempts) {
            clearInterval(poller);
            console.warn('Title element not found. Please use the "Trigger Geo-Check" button at the top.');
        }
    }, 500);
}

window.addEventListener('yt-navigate-finish', handleNavigation);
handleNavigation();
