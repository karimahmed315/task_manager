import tkinter as tk
from tkinter import messagebox, simpledialog
from tkinter import ttk
from datetime import datetime

class TaskManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Assistive Task Manager")
        self.root.geometry("800x480")

        # Welcome Screen
        self.show_welcome_screen()

    def show_welcome_screen(self):
        self.clear_screen()
        welcome_label = tk.Label(self.root, text="Welcome to Assistive Task Manager", font=("Arial", 24))
        welcome_label.pack(pady=20)
        setup_button = tk.Button(self.root, text="Set Up", command=self.show_setup_screen)
        setup_button.pack(pady=10)

    def show_setup_screen(self):
        self.clear_screen()
        instructions = """
        Instructions:
        - Add Task: Add a new task manually.
        - Remove Task: Remove a task manually.
        - Mark Task as Completed: Mark a task as completed manually.
        - Calendar: View and add tasks for specific dates.
        - History: View completed, deleted, and overdue tasks.
        - Settings: Configure Wi-Fi, view instructions, and other settings.
        """
        instructions_label = tk.Label(self.root, text=instructions, justify=tk.LEFT)
        instructions_label.pack(pady=20)
        start_button = tk.Button(self.root, text="Start", command=self.show_main_screen)
        start_button.pack(pady=10)

    def show_main_screen(self):
        self.clear_screen()
        self.create_sidebar()
        self.create_task_list()

    def create_sidebar(self):
        sidebar = tk.Frame(self.root, width=200, bg='lightgrey')
        sidebar.pack(side=tk.LEFT, fill=tk.Y)

        buttons = [
            ("Add Task", self.add_task),
            ("Remove Task", self.remove_task),
            ("Mark Task as Completed", self.mark_task_completed),
            ("Calendar", self.show_calendar),
            ("History", self.show_history),
            ("Settings", self.show_settings)
        ]

        for (text, command) in buttons:
            button = tk.Button(sidebar, text=text, command=command, width=20)
            button.pack(pady=5)

    def create_task_list(self):
        self.task_list_frame = tk.Frame(self.root)
        self.task_list_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        self.task_list = tk.Listbox(self.task_list_frame)
        self.task_list.pack(fill=tk.BOTH, expand=True)

        # Example tasks
        for i in range (24):
            self.task_list.insert(tk.END, f"{i:02d}:00 - Task {i+1}")

    def add_task(self):
        self.clear_screen()
        self.create_sidebar()
        self.create_task_list()

        task_name = simpledialog.askstring("Add Task", "Enter task name:")
        task_time = simpledialog.askstring("Add Task", "Enter task time (HH:MM):")
        task_date = simpledialog.askstring("Add Task", "Enter task date (YYYY-MM-DD):")

        if task_name and task_time and task_date:
            task = f"{task_date} {task_time} - {task_name}"
            self.task_list.insert(tk.END, task)
        else:
            messagebox.showwarning("Input Error", "All fields are required.")

    def remove_task(self):
        self.clear_screen()
        self.create_sidebar()
        self.create_task_list()

        selected_tasks = self.task_list.curselection()
        if selected_tasks:
            for index in selected_tasks[::-1]:
                self.task_list.delete(index)
        else:
            messagebox.showwarning("Selection Error", "No task selected.")

    def mark_task_completed(self):
        self.clear_screen()
        self.create_sidebar()
        self.create_task_list()

        selected_tasks = self.task_list.curselection()
        if selected_tasks:
            for index in selected_tasks:
                task = self.task_list.get(index)
                self.task_list.delete(index)
                self.task_list.insert(tk.END, f"{task} (Completed)")
        else:
            messagebox.showwarning("Selection Error", "No task selected.")

    def show_calendar(self):
        self.clear_screen()
        self.create_sidebar()

        calendar_label = tk.Label(self.root, text="Calendar View (Under Construction)", font=("Arial", 18))
        calendar_label.pack(pady=20)

    def show_history(self):
        self.clear_screen()
        self.create_sidebar()

        history_label = tk.Label(self.root, text="History View (Under Construction)", font=("Arial", 18))
        history_label.pack(pady=20)

    def show_settings(self):
        self.clear_screen()
        self.create_sidebar()

        settings_label = tk.Label(self.root, text="Settings View (Under Construction)", font=("Arial", 18))
        settings_label.pack(pady=20)

    def clear_screen(self):
        for widget in self.root.winfo_children():
            widget.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = TaskManagerApp(root)
    root.mainloop()
