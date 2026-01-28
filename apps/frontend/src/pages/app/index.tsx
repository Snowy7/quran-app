import { useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@template/backend";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@template/ui";
import { Plus, Trash2, Check, Circle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/brand/logo";
import { Link } from "react-router-dom";

export default function AppPage() {
  const { user } = useUser();
  const [newTodo, setNewTodo] = useState("");

  const todos = useQuery(api.todos.list);
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const deleteTodo = useMutation(api.todos.remove);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    await createTodo({ text: newTodo.trim() });
    setNewTodo("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-xl items-center justify-between px-4 mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-semibold">Template</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-screen-md mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Welcome, {user?.firstName || "there"}!
          </h1>
          <p className="text-muted-foreground">
            Here's your todo list for today.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Todo Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Add a new todo..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            {/* Todo List */}
            <div className="space-y-2">
              {todos === undefined ? (
                // Loading state
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : todos.length === 0 ? (
                // Empty state
                <div className="text-center py-8 text-muted-foreground">
                  <p>No todos yet. Add one above!</p>
                </div>
              ) : (
                // Todo items
                todos.map((todo) => (
                  <div
                    key={todo._id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <button
                      onClick={() => toggleTodo({ id: todo._id })}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {todo.completed ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span
                      className={`flex-1 ${
                        todo.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo({ id: todo._id })}
                      className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export { AppPage };
