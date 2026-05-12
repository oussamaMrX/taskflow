import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/authMiddleware'

const router = Router()

// All project routes are protected
router.use(authenticate)

// GET all projects for the logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.userId },
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ projects })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// GET a single project by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.userId },
      include: { tasks: true },
    })
    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.json({ project })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST create a new project
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ message: 'Project name is required' })

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.userId as number,
      },
    })
    res.status(201).json({ message: 'Project created', project })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH update a project
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  const { name, description } = req.body

  try {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.userId },
    })
    if (!existing) return res.status(404).json({ message: 'Project not found' })

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name, description },
    })
    res.json({ message: 'Project updated', project })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE a project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)

  try {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.userId },
    })
    if (!existing) return res.status(404).json({ message: 'Project not found' })

    await prisma.project.delete({ where: { id: projectId } })
    res.json({ message: 'Project deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router