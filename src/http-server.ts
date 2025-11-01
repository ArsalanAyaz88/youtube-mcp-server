import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { VideoService } from './services/video.js';
import { TranscriptService } from './services/transcript.js';
import { PlaylistService } from './services/playlist.js';
import { ChannelService } from './services/channel.js';

const PORT = Number(process.env.PORT || 3000);

if (!process.env.YOUTUBE_API_KEY) {
    console.error('Error: YOUTUBE_API_KEY environment variable is required.');
    process.exit(1);
}

const app = express();
app.use(express.json());

const videoService = new VideoService();
const transcriptService = new TranscriptService();
const playlistService = new PlaylistService();
const channelService = new ChannelService();

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

function asyncHandler(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
        handler(req, res).catch(next);
    };
}

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.get(
    '/videos/:videoId',
    asyncHandler(async (req, res) => {
        const partsParam = req.query.parts;
        const parts = Array.isArray(partsParam)
            ? partsParam.map((part) => part?.toString().trim()).filter(Boolean)
            : typeof partsParam === 'string'
              ? partsParam.split(',').map((part) => part.trim()).filter(Boolean)
              : undefined;

        const video = await videoService.getVideo({
            videoId: req.params.videoId,
            parts,
        });

        res.json({ data: video });
    })
);

app.get(
    '/videos/:videoId/stats',
    asyncHandler(async (req, res) => {
        const stats = await videoService.getVideoStats({
            videoId: req.params.videoId,
        });

        res.json({ data: stats });
    })
);

app.get(
    '/videos',
    asyncHandler(async (req, res) => {
        const query = typeof req.query.q === 'string' ? req.query.q : undefined;
        if (!query) {
            res.status(400).json({ error: 'Query parameter "q" is required.' });
            return;
        }

        const maxResults = req.query.maxResults ? Number(req.query.maxResults) : undefined;
        const results = await videoService.searchVideos({
            query,
            maxResults,
        });

        res.json({ data: results });
    })
);

app.get(
    '/videos/:videoId/transcript',
    asyncHandler(async (req, res) => {
        const language = typeof req.query.language === 'string' ? req.query.language : undefined;
        const transcript = await transcriptService.getTranscript({
            videoId: req.params.videoId,
            language,
        });

        res.json({ data: transcript });
    })
);

app.get(
    '/channels/:channelId',
    asyncHandler(async (req, res) => {
        const channel = await channelService.getChannel({
            channelId: req.params.channelId,
        });

        res.json({ data: channel });
    })
);

app.get(
    '/channels/:channelId/videos',
    asyncHandler(async (req, res) => {
        const maxResults = req.query.maxResults ? Number(req.query.maxResults) : undefined;
        const videos = await channelService.listVideos({
            channelId: req.params.channelId,
            maxResults,
        });

        res.json({ data: videos });
    })
);

app.get(
    '/playlists/:playlistId',
    asyncHandler(async (req, res) => {
        const playlist = await playlistService.getPlaylist({
            playlistId: req.params.playlistId,
        });

        res.json({ data: playlist });
    })
);

app.get(
    '/playlists/:playlistId/items',
    asyncHandler(async (req, res) => {
        const maxResults = req.query.maxResults ? Number(req.query.maxResults) : undefined;
        const items = await playlistService.getPlaylistItems({
            playlistId: req.params.playlistId,
            maxResults,
        });

        res.json({ data: items });
    })
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
});

app.listen(PORT, () => {
    console.log(`HTTP wrapper listening on port ${PORT}`);
});
