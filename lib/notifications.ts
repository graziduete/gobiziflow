import { createClient } from "@/lib/supabase/server"
import { emailTemplates, sendEmail } from "@/lib/email-server"

export async function sendTaskAssignedNotification(taskId: string, assignedToId: string, assignedById: string) {
  const supabase = await createClient()

  try {
    // Get task details
    const { data: task } = await supabase
      .from("tasks")
      .select(`
        title,
        due_date,
        projects (
          name
        )
      `)
      .eq("id", taskId)
      .single()

    if (!task) return false

    // Get assigned user details
    const { data: assignedUser } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", assignedToId)
      .single()

    // Get assigner details
    const { data: assigner } = await supabase.from("profiles").select("full_name").eq("id", assignedById).single()

    if (!assignedUser?.email) return false

    const template = emailTemplates.taskAssigned({
      taskTitle: task.title,
      projectName: task.projects?.name || "Projeto não encontrado",
      dueDate: task.due_date,
      assignedBy: assigner?.full_name || "Usuário não encontrado",
    })

    return await sendEmail({
      to: assignedUser.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  } catch (error) {
    console.error("Error sending task assigned notification:", error)
    return false
  }
}

export async function sendProjectCreatedNotification(projectId: string, createdById: string) {
  const supabase = await createClient()

  try {
    // Get project details including tenant_id
    const { data: project } = await supabase
      .from("projects")
      .select(`
        name,
        company_id,
        tenant_id,
        companies (
          name
        )
      `)
      .eq("id", projectId)
      .single()

    if (!project) return false

    // Get creator details
    const { data: creator } = await supabase.from("profiles").select("full_name").eq("id", createdById).single()

    // Determine target company_id based on tenant_id
    let targetCompanyId = project.company_id
    if (project.tenant_id) {
      // Se o projeto tem tenant_id, enviar email para usuários do tenant
      targetCompanyId = project.tenant_id
    }

    // Get company users based on tenant_id
    const { data: companyUsers } = await supabase
      .from("user_companies")
      .select(`
        profiles (
          email,
          full_name
        )
      `)
      .eq("company_id", targetCompanyId)

    if (!companyUsers) return false

    const template = emailTemplates.projectCreated({
      projectName: project.name,
      companyName: project.companies?.name || "Empresa não encontrada",
      createdBy: creator?.full_name || "Usuário não encontrado",
    })

    // Send to all company users
    const promises = companyUsers
      .filter((uc) => uc.profiles?.email)
      .map((uc) =>
        sendEmail({
          to: uc.profiles!.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      )

    const results = await Promise.all(promises)
    return results.every((result) => result)
  } catch (error) {
    console.error("Error sending project created notification:", error)
    return false
  }
}

export async function sendTaskDueReminders() {
  const supabase = await createClient()

  try {
    // Get tasks due in the next 24 hours
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: tasks } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        due_date,
        assigned_to,
        projects (
          name
        ),
        profiles!tasks_assigned_to_fkey (
          email,
          full_name
        )
      `)
      .eq("status", "todo")
      .lte("due_date", tomorrow.toISOString().split("T")[0])
      .not("assigned_to", "is", null)

    if (!tasks || tasks.length === 0) return true

    const promises = tasks
      .filter((task) => task.profiles?.email)
      .map((task) => {
        const template = emailTemplates.taskDueReminder({
          taskTitle: task.title,
          projectName: task.projects?.name || "Projeto não encontrado",
          dueDate: task.due_date!,
        })

        return sendEmail({
          to: task.profiles!.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
      })

    const results = await Promise.all(promises)
    return results.every((result) => result)
  } catch (error) {
    console.error("Error sending task due reminders:", error)
    return false
  }
}

export async function sendStatusChangedNotification(
  itemType: "project" | "task",
  itemId: string,
  oldStatus: string,
  newStatus: string,
  changedById: string,
) {
  const supabase = await createClient()

  try {
    let itemData: any
    let recipients: string[] = []

    if (itemType === "project") {
      // Get project details
      const { data: project } = await supabase
        .from("projects")
        .select(`
          name,
          company_id,
          companies (
            name
          )
        `)
        .eq("id", itemId)
        .single()

      if (!project) return false
      itemData = project

      // Get company users
      const { data: companyUsers } = await supabase
        .from("user_companies")
        .select(`
          profiles (
            email
          )
        `)
        .eq("company_id", project.company_id)

      recipients = companyUsers?.map((uc) => uc.profiles?.email).filter(Boolean) || []
    } else {
      // Get task details
      const { data: task } = await supabase
        .from("tasks")
        .select(`
          title,
          assigned_to,
          projects (
            name,
            company_id
          ),
          profiles!tasks_assigned_to_fkey (
            email
          )
        `)
        .eq("id", itemId)
        .single()

      if (!task) return false
      itemData = task

      // Send to assigned user
      if (task.profiles?.email) {
        recipients = [task.profiles.email]
      }
    }

    // Get changer details
    const { data: changer } = await supabase.from("profiles").select("full_name").eq("id", changedById).single()

    if (recipients.length === 0) return false

    const template = emailTemplates.statusChanged({
      itemType,
      itemName: itemData.name || itemData.title,
      oldStatus,
      newStatus,
      changedBy: changer?.full_name || "Usuário não encontrado",
    })

    const promises = recipients.map((email) =>
      sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    )

    const results = await Promise.all(promises)
    return results.every((result) => result)
  } catch (error) {
    console.error("Error sending status changed notification:", error)
    return false
  }
}
