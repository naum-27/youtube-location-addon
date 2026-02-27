console.log('--- GEO ADDON STARTING ---');

const VERCEL_URL = 'https://youtube-location-addon.vercel.app/api/guess';

function removeOldBadge() {
    const oldBadge = document.getElementById('yt-location-badge');
    if (oldBadge) {
        oldBadge.remove();
        console.log('Old badge removed.');
    }
}

async function fetchLocation(title, description) {
    console.log('Fetching location for:', title);
    try {
        const response = await fetch(VERCEL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description }),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
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
    badge.id = 'yt-location-badge';

    if (locationData.error) {
        badge.innerText = `❌ API Error: ${locationData.error}`;
        badge.style.backgroundColor = '#cc0000';
    } else {
        badge.innerText = `📍 ${locationData.city ? locationData.city + ', ' : ''}${locationData.country || 'Unknown'}`;
    }

    if (fallback) {
        // Fallback: Stick it to the top of the body
        badge.style.position = 'fixed';
        badge.style.top = '10px';
        badge.style.left = '50%';
        badge.style.transform = 'translateX(-50%)';
        badge.style.zIndex = '10000';
        document.body.appendChild(badge);
        console.log('Badge injected into BODY (fallback mode).');
    } else {
        const titleElement = document.querySelector('h1.ytd-watch-metadata');
        if (titleElement) {
            titleElement.parentElement.insertBefore(badge, titleElement.nextSibling);
            console.log('Badge injected into YouTube header.');
        } else {
            console.error('Title element lost during injection!');
        }
    }
}

async function handleNavigation() {
    console.log('Navigation event/initial run triggered.');
    let attempts = 0;
    const maxAttempts = 10; // 5 seconds (500ms * 10)

    const poller = setInterval(async () => {
        attempts++;
        console.log(`Polling for title... attempt ${attempts}/${maxAttempts}`);

        const titleElement = document.querySelector('h1.ytd-watch-metadata');
        const titleText = titleElement?.innerText?.trim();

        if (titleElement && titleText) {
            console.log('Title element found!');
            clearInterval(poller);

            const description = document.querySelector('#description-inline-expander')?.innerText || '';
            const locationData = await fetchLocation(titleText, description);
            injectBadge(locationData);
        } else if (attempts >= maxAttempts) {
            console.warn('Title element NOT found after 5s. Entering fallback mode.');
            clearInterval(poller);

            // Try fallback if we can't find the title but want to check the API
            const fallbackTitle = document.title.replace(' - YouTube', '');
            const locationData = await fetchLocation(fallbackTitle, 'Fallback Scrape');
            injectBadge(locationData, true);
        }
    }, 500);
}

// Ensure it runs on first load and on YouTube's internal navigation
window.addEventListener('yt-navigate-finish', handleNavigation);
handleNavigation();
