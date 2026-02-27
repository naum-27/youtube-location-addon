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
        const actionsContainer = document.querySelector('#top-level-buttons-computed') ||
            document.querySelector('ytd-menu-renderer.ytd-watch-metadata');

        if (actionsContainer) {
            // Inject at the beginning of the action buttons list
            actionsContainer.insertBefore(badge, actionsContainer.firstChild);
            console.log('Badge injected in front of action buttons (Like button area).');
        } else {
            // Fallback to title if actions menu is not found
            const titleElement = document.querySelector('h1.ytd-watch-metadata');
            if (titleElement) {
                titleElement.parentElement.insertBefore(badge, titleElement.nextSibling);
                console.log('Action menu not found, falling back to title injection.');
            }
        }
    }
}

async function handleNavigation() {
    console.log('Navigation event/initial run triggered.');
    removeOldBadge(); // Clear old badge immediately on navigation

    let attempts = 0;
    const maxAttempts = 20; // Increase to 10 seconds (500ms * 20) for more reliability

    const poller = setInterval(async () => {
        attempts++;
        console.log(`Polling for title... attempt ${attempts}/${maxAttempts}`);

        const titleElement = document.querySelector('h1.ytd-watch-metadata');
        const titleText = titleElement?.innerText?.trim();

        if (titleElement && titleText) {
            clearInterval(poller);
            console.log('Title element found automatically!');
            const description = document.querySelector('#description-inline-expander')?.innerText || '';
            const locationData = await fetchLocation(titleText, description);
            injectBadge(locationData);
        } else if (attempts >= maxAttempts) {
            clearInterval(poller);
            console.warn('Title element not found. Entering fallback mode.');

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
