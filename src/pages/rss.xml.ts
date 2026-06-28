import rss from '@astrojs/rss';
import truncateText from '../lib/truncateText';
import getFalafel from '../lib/falafelLoader';

export function GET(context: any) {
    const falafel = getFalafel();
    return rss({
        title: falafel.title,
        description: falafel.description,
        site: context.site,
        items: falafel.entryArr.map(p => {

            return {
                title: p.name,
                pubDate: new Date(p.dateSaved),
                description: truncateText(p.review, 50),
                content: p.review,
                link: `/wraps/${p.cacheKey}`,
                author: "duncanpetrie1@gmail.com",
                customData: `
                <googlemapslink>${p.googleMapsUri}</googlemapslink>
                <coordinates>${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</coordinates>
                `,
            }
        }),
        customData: `
        <language>en-us</language>
        <googlemapslink>${falafel.googleMapsUri}</googlemapslink>
        `,
    });
}