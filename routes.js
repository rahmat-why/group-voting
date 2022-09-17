import { Router } from 'express'
import response from './response.js'
import * as WhatsappController from './controllers/WhatsappController.js'

const router = Router()

router.post('/webhook', WhatsappController.webhook)

router.all('*', (req, res) => {
    response(res, 404, false, 'The requested url cannot be found.')
})

export default router