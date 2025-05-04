import tkinter as tk
from tkinter import messagebox, ttk
from tkcalendar import Calendar
from datetime import datetime, timedelta
from PIL import Image, ImageTk  # For handling icons

class TaskManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Assistive Task Manager")
        self.root.geometry("800x480")
        self.root.configure(bg="#f4f4f4")
        
        self.tasks = []  # Store tasks as a list of tuples (datetime, task_name, frequency)
        self.current_date = datetime.today().date()  # Track the current date
        self.icons = self.load_icons()        # Load icons
        self.show_welcome_screen()
        

    def load_icons(self):
        """Load icons from the 'App Icons' folder."""
        icon_names = [
            "add_task", "remove_task", "mark_as_complete",
            "home", "settings", "history", "calendar"
        ]
        icons = {}
        for name in icon_names:
            try:
                image = Image.open(f"App Icons/{name}.png")
                # Use Image.Resampling.LANCZOS instead of Image.ANTIALIAS
                image = image.resize((64, 64), Image.Resampling.LANCZOS)  # Resize icons
                icons[name] = ImageTk.PhotoImage(image)
            except Exception as e:
                print(f"Error loading icon {name}: {e}")
                icons[name] = None
        return icons

    def show_welcome_screen(self):
        self.clear_screen()
        frame = tk.Frame(self.root, bg="#f4f4f4")
        frame.pack(expand=True)
        
        welcome_label = tk.Label(frame, text="Welcome to Assistive Task Manager", font=("Arial", 20, "bold"), bg="#f4f4f4")
        welcome_label.pack(pady=20)
        
        setup_button = ttk.Button(frame, text="Set Up", command=self.show_instruction_screen)
        setup_button.pack(pady=10)

    def show_instruction_screen(self):
        self.clear_screen()
        frame = tk.Frame(self.root, bg="#f4f4f4")
        frame.pack(expand=True)

        # Define icon names, labels, and descriptions
        icon_info = [
            ("home", "Home", "View today's tasks in hourly format."),
            ("add_task", "Add Task", "Add a new task with date, time, and frequency."),
            ("remove_task", "Remove Task", "Remove an existing task."),
            ("mark_as_complete", "Mark as Complete", "Mark a task as completed."),
            ("calendar", "Calendar", "View and add tasks for specific dates."),
            ("history", "History", "View completed and overdue tasks."),
            ("settings", "Settings", "Configure app settings.")
        ]

        # Home icon at the top row, centered
        self.create_icon_frame(frame, icon_info[0], row=0, column=1)

        # Middle row: Add Task, Remove Task, Mark as Complete
        for i, icon_data in enumerate(icon_info[1:4], start=0):
            self.create_icon_frame(frame, icon_data, row=1, column=i)

        # Bottom row: Calendar, History, Settings
        for i, icon_data in enumerate(icon_info[4:], start=0):
            self.create_icon_frame(frame, icon_data, row=2, column=i)

        start_button = ttk.Button(frame, text="Start", command=self.show_main_screen)
        start_button.grid(row=3, column=0, columnspan=3, pady=20)

    def create_icon_frame(self, parent, icon_data, row, column):
        """Helper function to create an icon frame with label and description."""
        icon_name, label, description = icon_data
        icon_frame = tk.Frame(parent, bg="#f4f4f4")
        icon_frame.grid(row=row, column=column, padx=20, pady=20)

        # Icon
        if self.icons[icon_name]:
            icon_label = tk.Label(icon_frame, image=self.icons[icon_name], bg="#f4f4f4")
            icon_label.pack()

        # Label
        label_text = tk.Label(icon_frame, text=label, font=("Arial", 12, "bold"), bg="#f4f4f4")
        label_text.pack()

        # Description
        desc_text = tk.Label(icon_frame, text=description, font=("Arial", 10), bg="#f4f4f4", wraplength=150)
        desc_text.pack()

    def show_main_screen(self):
        self.clear_screen()
        self.create_sidebar()
        self.show_home_screen()

    def create_sidebar(self):
        sidebar = tk.Frame(self.root, width=100, bg='#d9d9d9')
        sidebar.pack(side=tk.LEFT, fill=tk.Y)

        # Define sidebar buttons with icons
        sidebar_buttons = [
            ("home", self.show_home_screen),
            ("add_task", self.show_add_task_screen),
            ("remove_task", self.remove_task),
            ("mark_as_complete", self.mark_task_completed),
            ("calendar", self.show_calendar),
            ("history", self.show_history),
            ("settings", self.show_settings)
        ]

        # Home icon at the top
        if self.icons["home"]:
            home_button = tk.Button(sidebar, image=self.icons["home"], command=self.show_home_screen, bg="#d9d9d9", bd=0)
            home_button.pack(fill=tk.X, padx=10, pady=10)

        # Add a separator
        separator = ttk.Separator(sidebar, orient="horizontal")
        separator.pack(fill=tk.X, pady=10)

        # Middle row: Add Task, Remove Task, Mark as Complete
        for icon_name, command in sidebar_buttons[1:4]:
            if self.icons[icon_name]:
                button = tk.Button(sidebar, image=self.icons[icon_name], command=command, bg="#d9d9d9", bd=0)
                button.pack(fill=tk.X, padx=10, pady=5)

        # Add another separator
        separator = ttk.Separator(sidebar, orient="horizontal")
        separator.pack(fill=tk.X, pady=10)

        # Bottom row: Calendar, History, Settings
        for icon_name, command in sidebar_buttons[4:]:
            if self.icons[icon_name]:
                button = tk.Button(sidebar, image=self.icons[icon_name], command=command, bg="#d9d9d9", bd=0)
                button.pack(fill=tk.X, padx=10, pady=5)


    def create_task_list(self):
        frame = tk.Frame(self.root, bg="#ffffff")
        frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.task_listbox = tk.Listbox(frame, font=("Arial", 14))
        self.task_listbox.pack(fill=tk.BOTH, expand=True)

    def show_home_screen(self):
        self.clear_main_area()
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


    def show_add_task_screen(self):
        self.clear_main_area()
        frame = tk.Frame(self.root, bg="#f4f4f4")
        frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        task_name_label = tk.Label(frame, text="Enter Task Name:")
        task_name_label.pack(pady=10)
        task_name_entry = tk.Entry(frame)
        task_name_entry.pack(pady=10)
        
        date_label = tk.Label(frame, text="Select Task Date (YYYY-MM-DD):")
        date_label.pack(pady=10)
        
        # Entry to show selected date
        date_entry = tk.Entry(frame)
        today = datetime.today().strftime('%Y-%m-%d')
        date_entry.insert(0, today)
        date_entry.pack(pady=10)

        time_label = tk.Label(frame, text="Enter Task Time (HH:MM):")
        time_label.pack(pady=10)
        time_entry = tk.Entry(frame)
        time_entry.pack(pady=10)

        frequency_label = tk.Label(frame, text="Select Frequency:")
        frequency_label.pack(pady=10)

        # Frequency selection (Daily, Weekly, etc.)
        frequency_options = ["Once", "Daily", "Weekly"]
        frequency_combobox = ttk.Combobox(frame, values=frequency_options)
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
                self.show_home_screen()  # Return to home screen after saving
            except ValueError:
                messagebox.showwarning("Invalid Input", "Please enter a valid date and time in the specified format.")
        
        save_button = ttk.Button(frame, text="Save Task", command=save_task)
        save_button.pack(pady=10)

    def clear_main_area(self):
        """Clear the main area to the right of the sidebar."""
        for widget in self.root.winfo_children():
            if isinstance(widget, tk.Frame) and widget.winfo_x() > 100:  # Assuming sidebar width is 100
                widget.destroy()

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