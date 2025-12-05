
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCollection, useDoc, useUser, useFirestore } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus } from 'lucide-react';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';

type TodoTask = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: any;
  isRecurring: boolean;
  panchayatId: string;
};

export function TodoList() {
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const firestore = useFirestore();

  const taskCollectionPath = useMemo(
    () => (profile ? `panchayats/${profile.panchayat}/tasks` : null),
    [profile]
  );
  const { data: tasks, loading: tasksLoading, setData: setTasks } = useCollection<TodoTask>(taskCollectionPath || 'dummy_path');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Generate recurring tasks
  useEffect(() => {
    if (!firestore || !profile || !taskCollectionPath) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkAndCreateTask = async (
      title: string,
      checkFn: () => boolean,
      taskIdSuffix: string
    ) => {
      if (!checkFn()) return;

      const taskId = `${today.toISOString().split('T')[0]}_${taskIdSuffix}`;
      const q = query(collection(firestore, taskCollectionPath), where('id', '==', taskId));
      const existing = await getDocs(q);

      if (existing.empty) {
        const newTask: Omit<TodoTask, 'id'> = {
          title,
          completed: false,
          dueDate: today,
          isRecurring: true,
          panchayatId: profile.panchayat,
        };
        const docRef = doc(firestore, taskCollectionPath, taskId);
        await setDoc(docRef, { ...newTask, id: taskId });
      }
    };

    // Check water supply every other day
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    checkAndCreateTask(
      'Check water supply status',
      () => dayOfYear % 2 === 0,
      'water_check'
    );
    
    // Schedule maintenance every 22 days
     checkAndCreateTask(
      'Schedule maintenance day',
      () => today.getDate() % 22 === 1, // Simplified logic
      'maintenance_schedule'
    );


  }, [firestore, profile, taskCollectionPath]);

  const handleAddTask = async () => {
    if (!firestore || !profile || !taskCollectionPath || !newTaskTitle.trim()) return;
    setIsAdding(true);
    const newTask = {
      title: newTaskTitle,
      completed: false,
      dueDate: serverTimestamp(),
      isRecurring: false,
      panchayatId: profile.panchayat,
    };
    try {
      await addDoc(collection(firestore, taskCollectionPath), newTask);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleTask = async (task: TodoTask) => {
    if (!firestore || !taskCollectionPath) return;
    const taskRef = doc(firestore, taskCollectionPath, task.id);
    await setDoc(taskRef, { completed: !task.completed }, { merge: true });
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!firestore || !taskCollectionPath) return;
    await deleteDoc(doc(firestore, taskCollectionPath, taskId));
  };


  const incompleteTasks = useMemo(() => tasks?.filter(t => !t.completed) || [], [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">My To-Do List</CardTitle>
      </CardHeader>
      <CardContent className="h-40 overflow-y-auto pr-2">
        {tasksLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : incompleteTasks.length > 0 ? (
          <ul className="space-y-2">
            {incompleteTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask(task)}
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className="flex-1 text-sm font-normal cursor-pointer"
                >
                  {task.title}
                </label>
                {!task.isRecurring && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteTask(task.id)}>
                        <X className="h-3 w-3" />
                    </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-center text-muted-foreground pt-4">No pending tasks. Well done!</p>
        )}
      </CardContent>
      <Separator />
       <div className="p-2 flex gap-2">
            <Input 
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="h-8"
            />
            <Button size="sm" onClick={handleAddTask} disabled={isAdding}>
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4" />}
            </Button>
        </div>
    </Card>
  );
}
