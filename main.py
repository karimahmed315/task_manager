import tkinter as tk
from tkinter import messagebox, ttk
from tkcalendar import Calendar
from datetime import datetime, timedelta

class TaskManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Assistive Task Manager")
        self.root.geometry("800x480")
        self.root.configure(bg="#f4f4f4")
        
        self.tasks = []  # Store tasks as a list of tuples (datetime, task_name, frequency)
        self.current_date = datetime.today().date()  # Track the current date
        self.show_welcome_screen()

    def show_welcome_screen(self):
        self.clear_screen()
        frame = tk.Frame(self.root, bg="#f4f4f4")
        frame.pack(expand=True)
        
        welcome_label = tk.Label(frame, text="Welcome to Assistive Task Manager", font=("Arial", 20, "bold"), bg="#f4f4f4")
        welcome_label.pack(pady=20)
        
        setup_button = ttk.Button(frame, text="Set Up", command=self.show_setup_screen)
        setup_button.pack(pady=10)

    def show_setup_screen(self):
        self.clear_screen()
        frame = tk.Frame(self.root, bg="#f4f4f4")
        frame.pack(expand=True)
        
        instructions = """
        Instructions:
        - Add Task: Add a new task manually.
        - Remove Task: Remove a task manually.
        - Mark Task as Completed: Mark a task as completed manually.
        - Calendar: View and add tasks for specific dates.
        - History: View completed, deleted, and overdue tasks.
        - Settings: Configure Wi-Fi, view instructions, and other settings.
        """
        instructions_label = tk.Label(frame, text=instructions, justify=tk.LEFT, font=("Arial", 12), bg="#f4f4f4")
        instructions_label.pack(pady=20)
        
        start_button = ttk.Button(frame, text="Start", command=self.show_main_screen)
        start_button.pack(pady=10)

    def show_main_screen(self):
        self.clear_screen()
        self.create_sidebar()
        self.create_task_list()

    def create_sidebar(self):
        sidebar = tk.Frame(self.root, width=200, bg='#d9d9d9')
        sidebar.pack(side=tk.LEFT, fill=tk.Y)

        buttons = [
            ("Home", self.show_home_screen),
            ("Add Task", self.add_task),
            ("Remove Task", self.remove_task),
            ("Mark Task as Completed", self.mark_task_completed),
            ("Calendar", self.show_calendar),
            ("History", self.show_history),
            ("Settings", self.show_settings)
        ]
        
        for text, command in buttons:
            button = ttk.Button(sidebar, text=text, command=command)
            button.pack(fill=tk.X, padx=10, pady=5)

    def create_task_list(self):
        frame = tk.Frame(self.root, bg="#ffffff")
        frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.task_listbox = tk.Listbox(frame, font=("Arial", 14))
        self.task_listbox.pack(fill=tk.BOTH, expand=True)

    def show_home_screen(self):
        self.clear_screen()
        self.create_sidebar()

        # Frame for the main content
        frame = tk.Frame(self.root, bg="#f4f4f4")
        frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Show today's date at the top
        today_label = tk.Label(frame, text=f"Today's Tasks - {self.current_date.strftime('%Y-%m-%d')}", 
                               font=("Arial", 16, "bold"), bg="#f4f4f4")
        today_label.pack(pady=10)

        # Create a canvas for scrolling
        canvas = tk.Canvas(frame)
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Create a scrollbar for the canvas
        scrollbar = tk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        scrollbar.pack(side=tk.RIGHT, fill="y")

        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.bind_all('<MouseWheel>', lambda event: canvas.yview_scroll(int(-1*(event.delta/120)), "units"))

        # Create a frame for the hourly tasks inside the canvas
        task_frame = tk.Frame(canvas, bg="#f4f4f4")
        canvas.create_window((0, 0), window=task_frame, anchor="nw")

        # Add hourly task slots for the whole day
        for hour in range(24):
            task_time = datetime.combine(self.current_date, datetime.min.time()).replace(hour=hour)
            task_label = tk.Label(task_frame, text=f"{task_time.strftime('%H:%M')} - ", font=("Arial", 12), bg="#f4f4f4")
            task_label.grid(row=hour, column=0, sticky="w", padx=10, pady=5)

            # Check if there are any tasks for this hour
            tasks_for_hour = [task for task in self.tasks if task[0].hour == hour and task[0].date() == self.current_date]
            if tasks_for_hour:
                for task in tasks_for_hour:
                    task_name = task[1]
                    task_frequency = task[2]
                    task_display = tk.Label(task_frame, text=f"{task_name} ({task_frequency})", font=("Arial", 12), bg="#f4f4f4", anchor="w")
                    task_display.grid(row=hour, column=1, sticky="w", padx=10, pady=5)
            else:
                task_display = tk.Label(task_frame, text="", font=("Arial", 12), bg="#f4f4f4", anchor="w")
                task_display.grid(row=hour, column=1, sticky="w", padx=10, pady=5)

        # Update the scrollable region of the canvas
        task_frame.update_idletasks()
        canvas.config(scrollregion=canvas.bbox("all"))

    def add_task(self, task_date=None, task_time=None):
        # Create the Add Task dialog
        add_task_dialog = tk.Toplevel(self.root)
        add_task_dialog.title("Add Task")
        add_task_dialog.geometry("400x250")
        
        task_name_label = tk.Label(add_task_dialog, text="Enter Task Name:")
        task_name_label.pack(pady=10)
        task_name_entry = tk.Entry(add_task_dialog)
        task_name_entry.pack(pady=10)
        
        date_label = tk.Label(add_task_dialog, text="Select Task Date (YYYY-MM-DD):")
        date_label.pack(pady=10)
        
        # Entry to show selected date
        date_entry = tk.Entry(add_task_dialog)
        if task_date:
            date_entry.insert(0, task_date.strftime('%Y-%m-%d'))
        else:
            date_entry.insert(0, self.current_date.strftime('%Y-%m-%d'))
        date_entry.pack(pady=10)
        
        time_label = tk.Label(add_task_dialog, text="Enter Task Time (HH:MM):")
        time_label.pack(pady=10)
        time_entry = tk.Entry(add_task_dialog)
        time_entry.pack(pady=10)

        frequency_label = tk.Label(add_task_dialog, text="Select Frequency:")
        frequency_label.pack(pady=10)

        # Frequency selection (Daily, Weekly, etc.)
        frequency_options = ["Once", "Daily", "Weekly"]
        frequency_combobox = ttk.Combobox(add_task_dialog, values=frequency_options)
        frequency_combobox.set("Once")
        frequency_combobox.pack(pady=10)

        def save_task():
            task_name = task_name_entry.get()
            task_date = date_entry.get()
            task_time = time_entry.get()
            task_frequency = frequency_combobox.get()
            
            try:
                task_datetime = datetime.strptime(f"{task_date} {task_time}", '%Y-%m-%d %H:%M')
                self.tasks.append((task_datetime, task_name, task_frequency))
                self.task_listbox.insert(tk.END, f"{task_datetime.strftime('%H:%M')} - {task_name} ({task_frequency})")
                add_task_dialog.destroy()
            except ValueError:
                messagebox.showwarning("Invalid Input", "Please enter a valid date and time in the specified format.")
        
        save_button = ttk.Button(add_task_dialog, text="Save Task", command=save_task)
        save_button.pack(pady=10)

    def remove_task(self):
        # Placeholder for remove task functionality
        messagebox.showinfo("Remove Task", "Remove task functionality is not implemented yet.")

    def mark_task_completed(self):
        # Placeholder for mark task as completed functionality
        messagebox.showinfo("Mark Task Completed", "Mark task as completed functionality is not implemented yet.")

    def show_calendar(self):
        self.clear_screen()  # Clear the screen before showing the calendar
        self.create_sidebar()  # Ensure sidebar is still present
        
        calendar_frame = tk.Frame(self.root)
        calendar_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        cal = Calendar(calendar_frame, selectmode="day", date_pattern="yyyy-mm-dd", font=("Arial", 14), state="normal")
        cal.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        def on_date_select(event, cal=cal):
            selected_date = cal.get_date()
            self.current_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
            self.show_home_screen()

        cal.bind("<ButtonRelease-1>", on_date_select)

        def on_double_click(event):
            selected_date = cal.get_date()
            self.show_tasks_for_date(selected_date)

        cal.bind("<Double-1>", on_double_click)

    def show_tasks_for_date(self, selected_date):
        self.clear_screen()  # Clear the screen before showing tasks for a specific date
        self.create_sidebar()  # Keep the sidebar visible

        frame = tk.Frame(self.root, bg="#f4f4f4")
        frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        tasks_for_day = [task for task in self.tasks if task[0].date() == datetime.strptime(selected_date, '%Y-%m-%d').date()]
        
        task_listbox = tk.Listbox(frame, font=("Arial", 14))
        task_listbox.pack(fill=tk.BOTH, expand=True)

        if tasks_for_day:
            for task in tasks_for_day:
                task_listbox.insert(tk.END, f"{task[0].strftime('%H:%M')} - {task[1]} ({task[2]})")
        else:
            task_listbox.insert(tk.END, "No tasks for this day.")

        back_button = ttk.Button(frame, text="Back to Calendar", command=self.show_calendar)
        back_button.pack(pady=10)

    def show_history(self):
        # Placeholder for show history functionality
        messagebox.showinfo("History", "History functionality is not implemented yet.")

    def show_settings(self):
        # Placeholder for settings functionality
        messagebox.showinfo("Settings", "Settings functionality is not implemented yet.")

    def clear_screen(self):
        for widget in self.root.winfo_children():
            widget.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = TaskManagerApp(root)
    root.mainloop()