// CDN-Based Backup Strategy
const CDN_URLS = {
    main: 'https://your-main-site.netlify.app',
    backup1: 'https://your-backup-site.netlify.app',
    backup2: 'https://your-vercel-backup.vercel.app',
    static: 'https://your-static-backup.github.io'
};

class CDNBackup {
    constructor() {
        this.currentCDN = 'main';
        this.fallbackOrder = ['main', 'backup1', 'backup2', 'static'];
    }

    async checkSite(url) {
        try {
            const response = await fetch(url, { 
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch (error) {
            console.log(`❌ ${url} is offline`);
            return false;
        }
    }

    async findWorkingSite() {
        for (const cdn of this.fallbackOrder) {
            const url = CDN_URLS[cdn];
            const isOnline = await this.checkSite(url);
            if (isOnline) {
                this.currentCDN = cdn;
                console.log(`✅ Using ${cdn}: ${url}`);
                return url;
            }
        }
        throw new Error('All sites are offline');
    }

    redirectToWorkingSite() {
        this.findWorkingSite()
            .then(url => {
                window.location.href = url;
            })
            .catch(() => {
                // Show offline message
                document.body.innerHTML = `
                    <div style="text-align: center; padding: 50px; font-family: Arial;">
                        <h1>🌍 Metaverse World</h1>
                        <p>All sites are currently offline. Please try again later.</p>
                        <button onclick="location.reload()">Retry</button>
                    </div>
                `;
            });
    }
}

// Usage
const backup = new CDNBackup();
// backup.redirectToWorkingSite(); 