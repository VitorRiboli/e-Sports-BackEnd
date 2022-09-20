import express from 'express';
import cors from 'cors';

import { PrismaClient } from '@prisma/client'
import { convertHoursStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToMinutesString } from './utils/convert-minutes-to-hours-string';


const app = express();

app.use(express.json())
app.use(cors()); //Configurado para todos entrarem

const prisma = new PrismaClient({
    log: ['query']
});

//Method para listagem de games
app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true
                }
            }
        }
    })

    return response.json(games);
});

//Criação de games
app.post('/games', async (request, response) => {
    const body = request.body;

    const createGame = await prisma.game.create({
        data: {
            title: body.title,
            banner: body.banner
        }    
    })

    return response.status(201).json(createGame);
})

//Criação de ADS, utiliza method POST
app.post('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;
    const body = request.body;

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hoursStart:  convertHoursStringToMinutes(body.hoursStart),
            hoursEnd: convertHoursStringToMinutes(body.hoursEnd),
            useVoiceChannel: body.useVoiceChannel,
        }
    })

    return response.status(201).json(ad);
});


//Listagem de ADS por games
//Parametro Routes(ID) :id os dois pontos é para indicar que é dinâmico, que pode mudar(var)
app.get('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hoursStart: true,
            hoursEnd: true,
        },
        where: {
            gameId: gameId
        },
        orderBy: {
            createdAt: 'desc',
        }
    })

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hoursStart: convertMinutesToMinutesString(ad.hoursStart),
            hoursEnd: convertMinutesToMinutesString(ad.hoursEnd),
        }
    }));
});


//Buscar discord pelo ID do anúncio
app.get('/ads/:id/discord', async (request, response) => {
    const adId = request.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true
        },

        where: {
            id: adId,
        }
    })

    return response.json({
        discord: ad.discord,
    }
    );
});



app.listen(3333);
