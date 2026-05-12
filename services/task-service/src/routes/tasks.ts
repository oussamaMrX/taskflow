import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/authMiddleware'

const router = Router()

router.use(authenticate)

// GET all tasks for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.projectId)

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.userId },
    })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ tasks })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST create a task inside a project
router.post('/project/:projectId', async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.projectId)
  const { title, description, priority, assigneeId } = req.body

  if (!title) return res.status(400).json({ message: 'Task title is required' })

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.userId },
    })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        assigneeId,
        projectId,
      },
    })
    res.status(201).json({ message: 'Task created', task })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH update a task (change title, status, priority etc.)
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const taskId = Number(req.params.id)
  const { title, description, status, priority, assigneeId } = req.body

  try {
    const task = await prisma.task.findFirst({
      where: { id: taskId },
      include: { project: true },
    })
    if (!task || task.project.ownerId !== req.userId) {
      return res.status(404).json({ message: 'Task not found' })
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { title, description, status, priority, assigneeId },
    })
    res.json({ message: 'Task updated', task: updated })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE a task
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const taskId = Number(req.params.id)

  try {
    const task = await prisma.task.findFirst({
      where: { id: taskId },
      include: { project: true },
    })
    if (!task || task.project.ownerId !== req.userId) {
      return res.status(404).json({ message: 'Task not found' })
    }

    await prisma.task.delete({ where: { id: taskId } })
    res.json({ message: 'Task deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router