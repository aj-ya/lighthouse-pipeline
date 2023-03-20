import puppeteer from 'puppeteer';
import axios from 'axios';
import lighthouse from 'lighthouse';
import Queue from 'bull';
const queue = new Queue('job-queue', 'redis://localhost:6379');

queue.process(async function (job, jobDone) {
    try {
        const { data } = await axios.get('http://localhost:9222/json/version');
        const websocket = data.webSocketDebuggerUrl;
        console.log(websocket);
        const browser = await puppeteer.connect({
            browserWSEndpoint: websocket,
        });
        const page = await browser.newPage();
        const { lhr } = await lighthouse(
            job.data.url,
            undefined,
            undefined,
            page
        );
        console.log(
            `Lighthouse scores: ${Object.values(lhr.categories)
                .map((c) => c.score)
                .join(', ')}`
        );
        await browser.close();
        jobDone();
    } catch (e) {
        console.log(e);
    }
});
