import type { SeedOverlayMapping } from './overlay-pack-helpers'

export const microsoftPurviewMappings: SeedOverlayMapping[] = [
  {
    practice_id: 'AC.L2-3.1.18',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite integrates with Compliance Retrieval service (NAC 2.0) with network access control to allow companies to make access control decisions, such as; what devices are allowed to access corporate Wi-Fi or VPN resources. Using Compliance Retrieval service with network access control and conditional access, Intune/Intune Suite, users can create access control decisions. The controls will determine if users will be allowed or denied access to corporate Wi-Fi or VPN resources based on whether the device they are using is managed and compliant with Intune device compliance policies.

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.19',
    inheritance_type: 'validation_required',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Encrypt CUI on mobile devices and mobile computing platforms using  Intune/Intune Suite with conditional access to require encryption, such as BitLocker for Windows 10 and later. Require app protection policy and approved client for cloud app access. Create and assign Microsoft Intune app protection policies to ensure that apps are protected with a PIN and Encrypted.

With Teams Premium, Teams admins can enable end-to-end meeting encryption for Teams meeting, ensuring that audio, video, and screen sharing features are encrypted.  

Via the embedded integration of Microsoft Copilot for Security allows users to review specific device configuration settings and provide information about the settings, enabling users to utilize secure and tested app protection policies for their devices.

Customer Responsibility
•	Developing processes and procedures for handling of CUI.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.2',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Microsoft Entra ID offers a robust security set for enforcing the types of transactions and functions that authorized users are permitted to execute. Best practice recommendation is to segregate duties within your team by setting up Role Based Access Control (RBAC) which will help you manage who has access to Azure resources. More granularity, you can restrict what the users can do with the resources and what areas they have access to. 

Ensure that the right users have the right access to the right resources by using intelligent cloud identity governance. Monitor and audit access to all resources while managing employee productivity.
Additionally, you can secure privileged access within your organization using Privileged Identity Management (PIM). PIM will reduce risk to accounts with the most privileged access, resources and data. PIM enforces Just In Time access for these accounts which allows timed permission to be granted for specific resources.
 
Customer Responsibility:
• Responsible for authorizing access to the customer system.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.20',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Block access by location with Microsoft Entra ID Conditional access to control and limit connections to and use of external information systems.

Customer Responsibility:
• Responsible for establishing terms and conditions allowing authorized individuals to access the customer-deployed resources from external information systems.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.21',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Using Intune, you can apply device configuration policies to Microsoft Entra ID user and/or device groups. The policies can also be set through the Device Installation CSP settings and the Device Installation GPOs. To protect your devices and corporate resources, you can use Microsoft Entra ID Conditional Access policies with Intune. 

Intune passes the results of your device compliance policies to Microsoft Entra ID, which then uses conditional access policies to enforce which devices and apps can access your corporate resources. 
Additionally, when managing devices in your organization, you want to create groups of settings that apply to different device groups. To prevent malware infections or data loss in your organization, you may want to block certain kinds of USB devices, such as a USB flash drive or camera, and allow other kinds of USB devices, such as a keyboard or mouse. Further, you may want to allow USB devices by specific device IDs. You can complete this task using Administrative Templates in Intune. The templates are built into Intune and do not require customization. 

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.22',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite can be configured to restrict the copying of data to publicly accessible information systems. Configure Intune to prevent data leaks on non-managed devices and setup app protection policies to secure company data on user-owned devices. 

Controlling data usage and posting information to publicly accessible systems requires information discovery, classification and labeling. Azure Information Protection unified labeling scanner can inspect any files that Windows can index. If you have configured sensitivity labels to apply automatic classification, the scanner can label discovered files to apply that classification, and optionally apply or remove protection.
Microsoft Cloud App Security lets you apply Azure Information Protection classification labels automatically, with or without protection, to files as a file policy governance action. You can also investigate files by filtering for the applied classification label within the Cloud App Security portal. Using classifications enables greater visibility and control of your sensitive data in the cloud. Authorized individuals to access the customer-deployed resources from external information systems.

Customer Responsibility:
•	 Responsible for designating authorized personnel to post publicly accessible information on customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.3',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `You can secure confidential data and control information flows with Azure Information Protection. Azure Information Protection (AIP) is a cloud-based solution that helps an organization to classify and optionally, protect its documents and emails by applying labels. Labels can be applied automatically by administrators who define rules and conditions, manually by users, or a combination where users are given recommendations.

Microsoft Defender for Endpoint and Microsoft Intune/Intune Suite, which can be integrated with Microsoft Copilot for Security, offer various capabilities for managing and securing devices and their data. However, Microsoft Copilot for Security itself focuses on providing recommendations and insights rather than directly controlling or blocking actions like isolating machines or managing data flows​. While Microsoft Copilot for Security enhances the capabilities of security teams by providing AI-driven insights and automation, the practical implementation of limiting access to authorized transactions and functions is achieved through the configuration of the integrated security and management tools.

Customer Responsibility 
•Responsible for controlling the flow of information within customer-deployed resources and between interconnected systems.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.5',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Microsoft Entra ID offers a robust security set for employing the principle of least privileged access. Best practice recommendation is to segregate duties within your team by setting up Role Based Access Control (RBAC) which will help you manage who has access to Azure resources. More granularly, you can restrict what the users can do with the resources and what areas they have access to. 

Additionally, you can secure privileged access within your organization using Privileged Identity Management (PIM). PIM will reduce risk to accounts with access to the most privileged access, resources and data. PIM enforces Just In Time access for these accounts which allows timed permission to be granted for specific resources.

Microsoft Copilot for Security, being part of the broader Microsoft security ecosystem, is designed to enhance the security posture of organizations through AI-driven insights and recommendations. While Copilot itself serves as a powerful tool for analyzing security data and generating actionable insights, the enforcement of the principle of least privilege is managed through the integration with other Microsoft security and administration products, such as Microsoft Defender, Microsoft Intune/Intune Suite, and Microsoft Entra. Although Microsoft Copilot for Security itself does not directly manage user privileges, its integration with these Microsoft security products means that it supports a security operations ecosystem where the principle of least privilege can be effectively implemented and managed. 

Customer Responsibility
•	Responsible for enforcing least privilege across customer-controlled accounts.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.6',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Microsoft Azure offers a robust security set for enforcing the use of non-privileged accounts or roles when accessing non-security functions. Best practice recommendation is to segregate duties within your team by setting up Role Based Access (RBAC) which will help you manage who has access to Azure resources. More granularity, you can restrict what the users can do with the resources and what areas they have access to. 

Additionally, you can secure privileged access within your organization using Privileged Identity Management (PIM). PIM will reduce risk to accounts with the most privileged access, resources and data. PIM enforces Just In Time access for these accounts which allows timed permission to be granted for specific resources.

Microsoft Copilot for Security does not have the ability to change roles or permissions, as these actions would be strictly limited to the administrator. When it integrates with applications such as Microsoft Intune and Microsoft Entra, it only has access to the RBAC permissions that are assigned to the administrator, ensuring that least privilege is maintained. Using the native features of Microsoft Copilot for Security, an administrator can review insights about users permissions, roles to make determinations if any adjustments needed to be made, including the ability for any non-privileged actions to occur.  Microsoft Copilot in Microsoft Entra gets insights from your Microsoft Entra users, groups, sign-in logs, and audit logs.

Customer Responsibility
•Responsible for requiring the use of non-privileged accounts/roles when accessing non-security functions for customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.7',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Microsoft Azure offers a robust security set for preventing the use of non-privileged accounts from executing privileged functions. Best practice recommendation is to segregate duties within your team by setting up Role Based Access (RBAC) which will help you manage who has access to Azure resources. More granularity, you can restrict what the users can do with the resources and what areas they have access to. 

Additionally, you can secure privileged access within your organization using Privileged Identity Management (PIM). PIM will reduce risk to accounts with the most privileged access, resources and data. PIM enforces Just In Time access for these accounts which allows timed permission to be granted for specific resources.

Microsoft Copilot for Security integrates with products like Microsoft Entra to support concepts like least privilege and RBAC while limiting exposure of privileged accounts or roles. Microsoft Entra ID Protection applies the capabilities of Copilot for Security to summarize a user's risk level, provide insights relevant to the incident at hand, and provide recommendations for rapid mitigation. Risky user summarization provides admins and responders quick access to the most critical information in context to aid their investigation.

Customer Responsibility:
• Responsible for auditing the execution of privileged functions on customer-deployed resources.
• Responsible for ensuring that non-privileged users cannot execute privileged functions on customer-deployed resources`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.9',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `There are two ways to create your company terms and conditions:
•	by using Intune/Intune Suite
•	by using the Microsoft Entra ID terms of use feature

Customer Responsibility 
•	Responsible for implementing a compliant system use notification for all customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AT.L2-3.2.1',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `No Microsoft Coverage.

Customer Responsibility
•	Providing role-based security training to users before authorizing access to customer-deployed resources or performing assigned duties. 
•	Providing role-based security training to all identified roles when required by changes to customer-deployed resources.
•	Providing ongoing, periodic role-based security training to all identified roles.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AT.L2-3.2.3',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `No Microsoft Coverage.

Customer Responsibility
•	Providing training on insider threats.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.1',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Consider using Microsoft Sentinel as your Security Information and Event Management (SIEM) solution. Connect your data sources to Microsoft Sentinel. Once Microsoft Sentinel is enabled on your Azure Monitor Log Analytics workspace, every GB of data ingested into the workspace can be retained at no charge for a default retention limit.

Retain the audit and sign-in activity data for longer than the default retention period outlined here by routing it to an Azure storage account using Azure Monitor.

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Retaining audit records for customer-deployed resources to support security investigations and meet regulatory requirements. Audit records must be retained for the defined frequency.
•Ensuring all customer-deployed resources have the ability to generate records for the auditable events`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.2',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Visualize and monitor log data using Microsoft Sentinel which allows you to create custom workbooks across your data, and also comes with built-in workbook templates to allow you to quickly gain insights across your data as soon as you connect a data source. Connect logs from sources such as, Microsoft Entra ID, Microsoft Defender for Endpoint, O365 and Intune/Intune Suite to Sentinel for optimal visibility of your users’ activities. 

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Configuring Azure auditing capabilities on customer-deployed resources to generate audit records containing the following: what type of event occurred, when the event occurred, where the event occurred, the source of the event, the outcome of the event, and the identity of any subjects associated with the event.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.5',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `After connecting your data sources to Microsoft Sentinel, use out-of-the-box detections, built-in templates to help you create threat detection rules. These templates were designed by Microsoft's team of security experts and analysts based on known threats, common attack vectors, and suspicious activity escalation chains. Rules created from these templates will automatically search across your environment for any activity that looks suspicious. Many of the templates can be customized to search for activities, or filter them out, according to your needs. The alerts generated by these rules will create incidents that you can assign and investigate in your environment.

Customer Responsibility
•Analyzing and correlating audit records across customer-deployed repositories.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.8',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Microsoft Sentinel uses Azure role-based access control (Azure RBAC) to provide built-in roles that can be assigned to users, groups, and services in Azure. Use Azure RBAC to create and assign roles within your security operations team to grant appropriate access 

Customer Responsibility
•Preventing unauthorized access to audit information and tools.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.9',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Use Azure RBAC to create and assign roles within your security operations team to grant appropriate access to Microsoft Sentinel to limit management of audit logging functionality to a subset of privileged users

Customer Responsibility
•Restricting the management of customer-controlled audit resources to authorized users.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.3',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Enable Change Tracking and Inventory to track changes in virtual machines hosted in Azure, on-premises, and other cloud environments. To track Azure Resource Manager property changes, see the Azure Resource Graph change history.

Changes made through Intune and Intune Suite can be tracked and audited, as tools are provided for reviewing configuration changes, and integrates with other Microsoft services such as Microsoft Entra ID and Azure Monitor for comprehensive monitoring, auditing and logging capabilities. 

Customer Responsibility 
•Reviewing proposed configuration-controlled changes to customer-deployed resources. 
•Documenting configuration-controlled changes associated with customer-deployed resources
•Implementing configuration-controlled changes approved
•Retaining a record of configuration-controlled changes to customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.9',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Consider exploring Azure Security Center’s adaptive application controls. Security Center uses machine learning to analyze the applications running on your machines and create a list of the known-safe software. Allow lists are based on your specific Azure workloads that you can customize. When you have enabled and configured adaptive application controls, you will get security alerts if any application runs other than the ones you have defined as safe. Requirements include Azure Defender for servers.

Intune Suite has applications such as Enterprise App Management that can be configured for app specific rules used to detect the presence of the Enterprise App Catalog  where users can choose to either manually configure the detection rules or use a custom script to detect the presence of the app before installing the app. The Enterprise App Catalog includes apps that self update, Intune ensures that the app is at least a target minimum version and considers the app installed if the detected version of the app is at or above the minimum version. The apps contained within the Enterprise App Catalog are Win32 apps. However, it is important to note that Microsoft does not provide security around the content provided in the Enterprise App Catalog  and it is up to the user to ensure it meets security and compliance requirements.

Customer Responsibility 
•Establishing a policy governing the installation of software on customer-deployed resources by users.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IR.L2-3.6.1',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Incident Response covers controls in the incident response life cycle - preparation, detection and analysis, containment, and post-incident activities. This includes using Azure services such as Azure Security Center and Sentinel to automate the incident response process.
 
Ensure your organization has processes to respond to security incidents, has updated these processes for Azure, and is regularly exercising them to ensure readiness. If enabled, Microsoft Defender XDR can automatically investigate and resolve alerts through automation and artificial intelligence. You can also perform additional remediation steps to resolve the attack including isolating the device from the network to allow for contained investigations. Additionally, Microsoft Defender for Endpoint automatically investigates all the incidents' supported events and suspicious entities in the alerts, providing you with auto response and information about the important files, processes, services, and more. Connect your data resources to Microsoft Sentinel for a centralized incident handling capability.

Set up security incident contact information in Azure Security Center. This contact information is used by Microsoft to contact you if the Microsoft Security Response Center (MSRC) discovers that your data has been accessed by an unlawful or unauthorized party. You also have options to customize incident alert and notification in different Azure services based on your incident response needs.

Azure Security Center provides high quality alerts across many Azure assets. You can use the ASC data connector to stream the alerts to Microsoft Sentinel. Microsoft Sentinel lets you create advanced alert rules to generate incidents automatically for an investigation.

Export your Azure Security Center alerts and recommendations using the export feature to help identify risks to Azure resources. Export alerts and recommendations either manually or in an ongoing, continuous fashion.

Microsoft Sentinel provides extensive data analytics across virtually any log source and a case management portal to manage the full lifecycle of incidents. Intelligence information during an investigation can be associated with an incident for tracking and reporting purposes.

Additionally, mark resources using tags and create a naming system to identify and categorize Azure resources, especially those processing sensitive data. It is your responsibility to prioritize the remediation of alerts based on the criticality of the Azure resources and environment where the incident occurred.

Use workflow automation features in Azure Security Center and Microsoft Sentinel to automatically trigger actions or run a playbook to respond to incoming security alerts. The playbook takes actions, such as sending notifications, disabling accounts, and isolating problematic networks. 

Microsoft Copilot for Security works with Microsoft Defender XDR, Microsoft Sentinel, Microsoft Intune, Microsoft Defender Threat Intelligence, Microsoft Purview, and Microsoft Defender Attack Surface Management. Copilot for Security can access data from these products and provide an assistive Copilot experience to increase the effectiveness and efficiency of security professionals using those solutions. Copilot for Security helps security professionals discover risks earlier, respond to them with greater guidance, and remain on top of vulnerabilities in the evolving threat landscape. Microsoft Entra is one of the Microsoft plugins that enable the Copilot for Security platform to generate accurate and relevant information. Through the Microsoft Entra plugin, the Copilot for Security portal can provide more context to incidents and generate more accurate results.

Copilot for Security works with Microsoft Purview by providing multiple capabilities summarizing alerts, triaging alerts, and drilling down into Purview data. These capabilities can be used to gain insight into Purview data and make connections between datapoints, and help understand your information security and compliance posture. Copilot for Security delivers information about threat actors, indicators of compromise (IOCs), tools, vulnerabilities, and contextual threat intelligence. 

Microsoft 365 CoPilot is an artificial intelligence (AI) assistant integrated into Microsoft 365 applications like Word, Excel, PowerPoint, etc. It is designed to enhance productivity and creativity throughout the Microsoft 365 ecosystem of products. With regard to this practice objective, Microsoft 365 CoPilot can help brainstorm and generate documentation regarding incident-handling for organizational systems that include preparation, detection, analysis, containment, recovery, and user response activities.

Customer Responsibility 
•Implementing key incident handling capabilities including preparation, detection and analysis, containment, eradication, and recovery.
•Providing incident response support resources that are integral to the organizational incident response capability, providing advice and assistance to users handling security incidents.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IR.L2-3.6.2',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Tracking and documenting system security incidents includes maintaining records about each incident, the status of the incident, and other pertinent information necessary for forensics, evaluating incident details, trends, and handling incident information can be obtained from a variety of sources including incident reports, incident response teams, audit monitoring, network monitoring, physical access monitoring, and user/administrator reports. 

Reporting incidents addresses specific incident reporting requirements within an organization and the formal incident reporting requirements for the organization. Suspected security incidents may also be reported and include the receipt of suspicious email communications that can potentially contain malicious code. The types of security incidents reported, the content and timeliness of the reports, and the designated reporting authorities reflect applicable laws, Executive Orders, directives, regulations, and policies. Microsoft Sentinel supports the tracking, documenting and reporting of incidents. Connect your sources to Microsoft Sentinel for one centralized location to manage incidents in your organization. 

Connect your data sources such as Azure Defender for IoT, O365 Security and Compliance, Azure Firewall and Microsoft Defender for Endpoint to Microsoft Sentinel for a centralized source of detection and reporting. Microsoft Sentinel provides out-of-the-box, built-in templates to help you create threat detection rules. These templates were designed by Microsoft's team of security experts and analysts based on known threats, common attack vectors, and suspicious activity escalation chains. Rules created from these templates will automatically search across your environment for any activity that looks suspicious. Many of the templates can be customized to search for activities, or filter them out, according to your needs. The alerts generated by these rules will create incidents that you can assign and investigate in your environment. To learn how to automate your responses to threats, Set up automated threat responses in Microsoft Sentinel.

Incident reporting is a formal part of the incident closure process. In Microsoft Sentinel you can use workbooks, Workbooks provide a dashboard to summarize security data visually. Microsoft Sentinel includes numerous default dashboards and customizable templates to facilitate incident analysis. 

Microsoft Sentinel provides extensive data analytics across virtually any log source and a case management portal to manage the full lifecycle of incidents. Intelligence information during an investigation can be associated with an incident for tracking and reporting purposes. 

Additionally, mark resources using tags and create a naming system to identify and categorize Azure resources, especially those processing sensitive data. It is your responsibility to prioritize the remediation of alerts based on the criticality of the Azure resources and environment where the incident occurred.

Use workflow automation features in Azure Security Center and Microsoft Sentinel to automatically trigger actions or run a playbook to respond to incoming security alerts. The playbook takes actions, such as sending notifications, disabling accounts, and isolating problematic networks.

Microsoft Security Response Center
Set up security incident contact information in Azure Security Center. This contact information is used by Microsoft to contact you if the Microsoft Security Response Center (MSRC) discovers that your data has been accessed by an unlawful or unauthorized party. You also have options to customize incident alert and notification in different Azure services based on your incident response needs. Additionally, if you are a security researcher and believe you have found a Microsoft security vulnerability, Microsoft would like to work with you to investigate it. Please note that the Microsoft Security Response Center does not provide technical support for Microsoft products.

Microsoft Copilot for Security responds to threats at the speed of AI with assisted incident investigation and response via the embedded experience in Microsoft Defender XDR, Copilot for Security provides summaries for active incidents and actionable step-by-step guidance for incident response, creating complete post-response activity. With Copilot for Security, users can gain structured and contextualized insights into emerging threats, attack techniques, and whether an organization is exposed to a specific threat. Copilot for Security helps prevent exposure to activity group campaigns and respond to incidents with greater guidance. Copilot for Security delivers information about threat actors, indicators of compromise (IOCs), tools, and vulnerabilities, as well as contextual threat intelligence from Microsoft Defender Threat Intelligence. Users can use prompts and promptbooks to investigate incidents, enrich their hunting flows with threat intelligence information, or gain more knowledge about their organization's or the global threat landscape.

Microsoft 365 CoPilot is an artificial intelligence (AI) assistant integrated into Microsoft 365 applications like Word, Excel, PowerPoint, etc. It is designed to enhance productivity and creativity throughout the Microsoft 365 ecosystem of products. With regard to this practice objective, Microsoft 365 CoPilot can help brainstorm and generate documentation regarding incident-handling for organizational systems that include preparation, detection, analysis, containment, recovery, and user response activities.

Customer Responsibility 
•providing incident response training to users of customer-deployed resources in accordance with assigned roles and responsibilities.
•implementing key incident handling capabilities including preparation, detection and analysis, containment, eradication, and recovery.
•for incident monitoring of customer-deployed resources.
•for requiring personnel to report suspected security incidents to the organizational incident response capability.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MA.L2-3.7.3',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `To ensure equipment removed for off-site maintenance is sanitized of any CUI, you will need identify what data is considered CUI. Discovery and labeling sensitive data are the first steps to controlling data security. Labeling sensitive data is something organizations should implement across both physical and logical media. Government regulations such as NIST SP 800-171 (Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations) implicitly specify controls for protecting controlled unclassified information (CUI). This requirement spans across all industries and geographies. The European Union requires secure handing of personally identifiable information (PII) in the General Data Protection Regulation (GDPR) and California has recently implemented a similar regulation with the California Consumer Privacy Regulation (CCPA).

Azure Information Protection
Azure Information Protection (AIP) provides a capability to enable data discovery called scanner. Scanner searches for what sensitive information you have in files that are stored in an on-premises data store or within your cloud environment. For example, a local folder, network share, or SharePoint Server. 

Customer Responsibility
•Removed CUI from equipment such as laptops removed for off-site maintenance.
•After running the AIP scanner, the customer must securely erase the CUI data.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.1',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Azure Information Protection (AIP)
With AIP you can control and secure emails, documents, and sensitive date inside and outside your organization. Enhance data protection with API, from easy classification to embedded labels and permissions, no matter where it is stored or who it is shared with.

After you have installed and configured AIP clients, you might need to learn more about how the client interprets the different usage rights that can be used to protect documents and emails. 

Intune/Intune Suite
Intune helps protect devices and your corporate data with tools like security baselines, Microsoft Entra ID conditional access, and partners for Mobile Threat Defense. Use Conditional Access with Microsoft Intune to control the devices and apps that can connect to your email and company resources. When integrated, you can gate access to keep your corporate data secure, while giving users an experience that allows them to do their best work from any device, and from any location. Conditional Access is an Microsoft Entra ID capability that is included with an Microsoft Entra ID Premium license. Through Microsoft Entra ID, Conditional Access brings signals together to make decisions, and enforce organizational policies. Intune enhances this capability by adding mobile device compliance and mobile app management data to the solution. 

Azure Key Vault
Azure Key Vault is a cloud service that safeguards encryption keys and secrets like certificates, connection strings, and passwords. Because this data is sensitive and business critical, you need to secure access to your key vaults by allowing only authorized applications and users. 

Microsoft Entra Multifactor Authentication
Multi-factor authentication helps safeguard access to data and applications. It provides an additional layer of security using a second form of authentication. Organizations can use Conditional Access to make the solution fit their specific needs. Microsoft Entra Multifactor Authentication is deployed by enforcing policies with Conditional Access. Administrators can choose the authentication methods that they want to make available for users. It is important to allow more than a single authentication method so that users have a backup method available in case their primary method is unavailable.

Customer Responsibility 
•Physically control paper media containing CUI
•Physically control digital media such as, diskettes, magnetic tapes, external and removable hard disk drives, flash drives, compact disks, and digital video disks. containing CUI
•Securely store paper media and digital media containing CUI`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.2',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Azure role-based access control (Azure RBAC) is the authorization system you use to manage access to Azure resources. To grant access, you assign roles to users, groups, service principals, or managed identities at a particular scope. This article describes how to assign roles using the Azure portal. If you need to assign administrator roles in Microsoft Entra ID, see Assign Microsoft Entra ID roles to users.

Role-based access control (RBAC) helps you manage who has access to your organization's resources and what they can do with those resources. By assigning roles to your Intune users, you can limit what they can see and change. Each role has a set of permissions that determine what users with that role can access and change within your organization.

Use Conditional Access with Microsoft Intune to control the devices and apps that can connect to your email and company resources. When integrated, you can gate access to keep your corporate data secure, while giving users an experience that allows them to do their best work from any device, and from any location.

Conditional Access is an Microsoft Entra ID capability that is included with an Microsoft Entra ID Premium license. Through Microsoft Entra ID, Conditional Access brings signals together to make decisions, and enforce organizational policies. Intune enhances this capability by adding mobile device compliance and mobile app management data to the solution.

Use device compliance policy to establish the conditions by which devices and users are allowed to access your network and company resources such as requiring a device to be marked as compliant, require multi-factor authentication, require approved client app and trusted network locations. 

Customer Responsibility 
•Identifying CUI to ensure the controls are applied to the applicable data.
•Limiting access to CUI on system media to authorized users only.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.3',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `This requirement applies to all system media, digital and non-digital, subject to disposal or reuse. Examples include: digital media found in workstations, network components, scanners, copiers, printers, notebook computers, and mobile devices; and non-digital media such as paper and microfilm. 

The sanitization process removes information from the media such that the information cannot be retrieved or reconstructed. Sanitization techniques, including clearing, purging, cryptographic erase, and destruction, prevent the disclosure of information to unauthorized individuals when such media is released for reuse or disposal.

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.4',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `You can secure confidential data and control information flows with Azure Information Protection. Azure Information Protection (AIP) is a cloud-based solution that helps an organization to classify and optionally, protect its documents and emails by applying labels. Labels can be applied automatically by administrators who define rules and conditions, manually by users, or a combination where users are given recommendations. 

Customer Responsibility 
•Marking CUI with applicable marking. (e.g., CUI/SP-XX/NOFORN in subject of email, etc. in addition to applying correct AIP label.)
•Limiting distribution to media containing CUI.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.5',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Microsoft recommends a layered approach to securing removable media, and Microsoft Defender for Endpoint provides multiple monitoring and control features to help prevent threats in unauthorized peripherals from compromising your devices. Discover plug and play connected events for peripherals in Microsoft Defender for Endpoint advanced hunting. To prevent malware infections or data loss, an organization may restrict USB drives and other peripherals. 

Allow or block removable devices based on granular configuration to deny write access to removable disks and approve or deny devices by using USB device IDs. Flexible policy assignment of device installation settings based on an individual or group of Microsoft Entra ID  users and devices. The controls can be set through the Intune Administrative Templates. Using Intune, you can apply device configuration policies to Microsoft Entra ID user and/or device groups. The above policies can also be set through the Device Installation CSP settings and the Device Installation GPOs.

Limiting access to sensitive data with least privilege reduces the risk of spillage or unauthorized access. Azure role-based access control (Azure RBAC) is the authorization system you use to manage access to Azure resources. To grant access, you assign roles to users, groups, service principals, or managed identities at a particular scope. Administrators can apply labels to classify data using Azure Information Protection. Azure Information Protection uses the Azure Rights Management service (Azure RMS) to protect your data. Azure RMS uses encryption, identity, and authorization policies. Similar to AIP labels, protection applied using Azure RMS stays with the documents and emails, regardless of the document or email's location, ensuring that you stay in control of your content even when it is shared with other people. 

After classifying data and applying labeling, Azure Information Protection allows you to configure which users or groups have access to that data. 

 Additionally, The Azure portal provides you with several options to access user activity logs on the Microsoft Entra ID menu. Microsoft's primary MDM tool is Microsoft Intune. Intune is part of a larger Microsoft MDM platform called Intune/Intune Suite.

Using Intune, administrators can enroll, configure, and manage mobile devices on several different operating system platforms, wherever the devices happen to be. Administrators can even intervene when a threat to security occurs, by blocking a device’s access to the company network and erasing any sensitive information stored on it.

Organizations can configure policies to allow, block and restrict USB drives and other peripherals. 
Organization can allow users to install only the USB drives and other peripherals included on a list of authorized devices or device types or prevent users from installing USB drives and other peripherals included on a list of unauthorized devices and device types. 

Additionally, using Intune, you can apply device configuration policies to Microsoft Entra ID user and/or device groups. The policies can also be set through the Device Installation CSP settings and the Device Installation GPOs. To protect your devices and corporate resources, you can use Microsoft Entra ID  Conditional Access policies with Intune. 

Intune/Intune Suite passes the results of your device compliance policies to Microsoft Entra ID, which then uses conditional access policies to enforce which devices and apps can access your corporate resources. 
When managing devices in your organization, you want to create groups of settings that apply to different device groups. You can complete this task using Administrative Templates in Intune/Intune Suite. The templates are built into Intune and do not require customization. 

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.6',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `BitLocker To Go is BitLocker Drive Encryption on removable data drives. As with BitLocker, you can open drives that are encrypted by BitLocker To Go by using a password or smart card on another computer.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.9',
    inheritance_type: 'validation_required',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `There are several methods to protecting backups including access management, redundancy and encryption. Azure Role-Based Access Control (RBAC) enables fine-grained access management for Azure. Using RBAC, you can segregate duties within your team and grant only the amount of access to users that they need to perform their jobs. Azure Backup provides three built-in roles to control backup management operations.

Secure your backups and protect against ransomware by enabling multifactor authentication using a security PIN generated in the Azure portal. If it is enabled, you are asked to authenticate from another device (for example, a mobile phone) while signing into the Azure portal. When you perform critical operations in Backup, you have to enter a security PIN, available on the Azure portal. Enabling Microsoft Entra Multifactor Authentication adds a layer of security. Only authorized users with valid Azure credentials, and authenticated from a second device, can access the Azure portal.

Fully control how you protect and access your data with customer-managed keys that use 256-bit AES encryption. You can use your own encryption key to protect the data in your storage account. When you specify a customer-managed key, that key is used to protect and control access to the key that encrypts your data. Customer-managed keys offer greater flexibility to manage access controls. 

Create private endpoints within your Azure Virtual Network to securely backup and restore data from your Recovery Services vaults. Azure Backup allows you to securely backup and restore your data from your Recovery Services vaults using private endpoints. Private endpoints use one or more private IP addresses from your VNet, effectively bringing the service into your VNet. Private endpoints for Backup can be only created for Recovery Services vaults that do not have any items protected to it (or haven't had any items attempted to be protected or registered to it in the past). So, we suggest you create a new vault to start with. 

All your backed-up data is automatically encrypted when stored in the cloud using Azure Storage encryption, which helps you meet your security and compliance commitments. This data at rest is encrypted using 256-bit AES encryption, one of the strongest block ciphers available, and is FIPS 140-2 compliant. In addition to encryption at rest, all your backup data in transit is transferred over HTTPS. It always remains on the Azure backbone network.

Customer Responsibility
•	Responsible for conducting backups of user-level information in customer-deployed resources at a frequency consistent with customer-defined RTO's and RPO's. Note: if the customer configures Microsoft Azure backup services appropriately, Azure can support data loss prevention.
•	Responsible for conducting backups of system-level information in customer-deployed resources at a frequency consistent with customer-defined RTO's and RPO's. Note: if the customer configures Microsoft Azure backup services appropriately, Azure can support data loss prevention.
•	Responsible for conducting backups of system documentation information in customer-deployed resources at a frequency consistent with customer-defined RTO's and RPO's. Note: if the customer configures Microsoft Azure backup services appropriately, Azure can support data loss prevention.
•	Responsible for protecting the confidentiality, integrity, and availability (CIA) of customer-controlled backup data. Note: if the customer configures Microsoft Azure backup services appropriately, Azure can support the protection of backup data.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'PE.L2-3.10.6',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite helps you ensure that your company's devices, apps, and data meet your company's security requirements. You have the control to set which requirements (Antivirus Status, MFA, Password Policy, etc.) need to be checked and what happens when those requirements aren't met. The Intune/Intune Suite admin center is where you can find the Microsoft Intune service, as well as other device management related settings.

MFA helps safeguard access to data and applications. It provides an additional layer of security using a second form of authentication. Organizations can use Conditional Access to make the solution fit their specific needs. Microsoft Entra Multifactor Authentication is deployed by enforcing policies with Conditional Access.

Conditional Access is the tool used by Microsoft Entra ID to bring signals together, to make decisions, and enforce organizational policies. Conditional Access is at the heart of the new identity driven control plane. Conditional access policies are highly configurable and include several capabilities:
•	Require MFA for admins
•	End user protection
•	Block legacy authentication
•	Require MFA for Service Management
•	Block access by location
•	Require trusted location for MFA registration
•	Require compliant devices

Customer Responsibility
•	Safeguarding measures for CUI are defined for alternate work sites.
•	Enforcing safeguarding measures for CUI for alternate work sites.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'PS.L2-3.9.1',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Personnel security screening (vetting) activities involve the evaluation/assessment of individual’s conduct, integrity, judgment, loyalty, reliability, and stability (i.e., the trustworthiness of the individual) prior to authorizing access to organizational systems containing CUI. The screening activities reflect applicable federal laws, Executive Orders, directives, policies, regulations, and specific criteria established for the level of access required for assigned positions.

You can ensure all employees who need access to CUI undergo organization-defined screening before being granted access based on the types of screening requirements for a given position and role. Clearly define positions and roles within your organization. Implement roles using Azure RBAC. For example, administrators with access to CUI and specific roles with permissions to view CUI should follow an organizationally defined screening process. 
 
Customer Responsibility
•	Screening individuals prior to authorizing access to customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'PS.L2-3.9.2',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `To protect organizational system containing CUI it is important to have controls in place that can identify users and remove access when needed. Microsoft Entra ID  is the cornerstone of identity in Azure. Microsoft Entra ID enables hybrid identities through Microsoft Entra ID Connect, an on-premises solution that is used to synchronize Active Directory identities with Microsoft Entra ID, as well as to deploy Active Directory Federation Services (ADFS).

RBAC helps in the creation and assignment of different permissions to different identities. This helps in segregating duties within teams, rather than everyone having all permissions. It is good practice to assign permissions using the principle of least permissions; this involves giving users the exact permissions they need to do their jobs properly. Users, groups, and applications are added to roles in Azure, and those roles have certain permissions. You can use the built-in roles that Azure offers, or you can create custom roles in RBAC.

Conditional Access allows you to set up access policies to prohibit a specific activity, as well as to trigger MFA according to rules that you define). You may target conditional access policies toward specific users or groups, or to specific apps.

Customer Responsibility: 
• Appropriately terminating customer personnel within a customer-defined time period.
• Appropriately transferring personnel and reviewing current logical and physical access authorizations to customer-deployed resources/facilities when individuals are reassigned or transferred.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'RA.L2-3.11.1',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `To help assess risk, Azure Security Center provides the Secure Score calculation to provide a readily consumable assessment of your risk posture. Security Center mimics the work of a security analyst, reviewing your security recommendations and applying advanced algorithms to determine how crucial each recommendation is. Azure Security center constantly reviews your active recommendations and calculates your Secure Score based on them, the score of a recommendation is derived from its severity and security best practices that will affect your workload security the most. Security Center also provides you with an Overall Secure Score.

Overall Secure Score is an accumulation of all your recommendation scores. You can view your overall Secure Score across your subscriptions or management groups, depending on what you select. The score will vary based on subscription selected and the active recommendations on these subscriptions. To check which recommendations impact your Secure Score most, you can view the top three most impactful recommendations in the Security Center dashboard or you can sort the recommendations in the recommendations list blade using the Secure Score impact column.

Additionally, Microsoft Defender for Endpoint is an endpoint security solution that includes risk-based vulnerability management and assessment; attack surface reduction capabilities; behavioral based and cloud-powered next generation protection; endpoint detection and response (EDR); automatic investigation and remediation; and managed hunting services. 

Intune/Intune Suite has applications such as Advanced Analytics which monitor for health anomalies of devices, query devices to get real time access to data about their health and configuration data, information which can be used to determine if devices pose specific risks to an organization's environment or require updates, patching or further review depending upon the type of risk they may pose.

Copilot for Security  for Microsoft Entra helps reduce the time to resolution by providing IT admins and SOC analysts the right context to investigate and remediate identity risk and identity-based incidents. Risky user summarization provides admins and responders quick access to the most critical information in context to aid their investigation. Microsoft Purview can use Microsoft Copilot for Security to investigate insider risk management activities and data loss prevention alerts, while Defender Threat Intelligence uses Copilot for Security to further enhance its threat intelligence capability to assess the risk landscape of the environment. Copilot for Security can be used with Intune/Intune Suite to determine device policy and configuration settings, and make determinations on which settings are noncompliant, reducing an organizxation's security risk posture. 

Customer Responsibility
•	Responsible for conducting a risk assessment that addresses the likelihood and magnitude of harm from the unauthorized access, use, disclosure, disruption, modification, or destruction of CUSTOMER-deployed resources and processed, stored, or transmitted information.
•	Responsible for reviewing the Microsoft Azure Security Authorization package and performing a risk assessment for any controls deferred to CUSTOMER relating to shared touch points as identified in the Microsoft Azure CUSTOMER Responsibility Matrix.
•	Responsible for conducting a risk assessment and documenting the risk assessment results in the security plan, risk assessment report, and/or other CUSTOMER-defined document.
•	Responsible for conducting a risk assessment and reviewing its results at a CUSTOMER-defined frequency.
•	Responsible for conducting a risk assessment and disseminating its results to CUSTOMER-defined personnel/roles. 
•	Responsible for updating the risk assessment at the CUSTOMER-defined frequency when there are significant changes to CUSTOMER-deployed resources (including the identification of new threats and vulnerabilities) or other conditions that may impact the security state of the system.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.1',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `You can configure NAT rules, network rules, and applications rules on Azure Firewall. The rules are processed according to the rule type and traffic is dropped by default if it is not permitted.

Outbound: If you configure network rules and application rules, then network rules are applied in priority order before application rules. The rules are terminating. So if a match is found in a network rule, no other rules are processed. If there is no network rule match, and if the protocol is HTTP, HTTPS, or MSSQL, then the packet is then evaluated by the application rules in priority order. If still no match is found, then the packet is evaluated against the infrastructure rule collection. If there is still no match, then the packet is denied by default.

Inbound Internet connectivity can be enabled by configuring Destination Network Address Translation (DNAT) as described in Tutorial: Filter inbound traffic with Azure Firewall DNAT using the Azure portal. NAT rules are applied in priority before network rules. If a match is found, an implicit corresponding network rule to allow the translated traffic is added. For security reasons, the recommended approach is to add a specific internet source to allow DNAT access to the network and avoid using wildcards. 

Application rules are not applied for inbound connections. So if you want to filter inbound HTTP/S traffic, you should use Web Application Firewall (WAF). 

Customer Responsibility:
• Monitoring and controlling communications at and within the boundaries of the CUSTOMER-deployed system. 
• Implementing subnetworks for CUSTOMER-deployed resources to logically separate publicly accessible resources from internal resources. 
• Restricting connections to external networks or systems through managed interfaces, consisting of boundary protection devices arranged in accordance with the CUSTOMER's security architecture.
• Configuring all CUSTOMER-deployed resources to communicate through FIPS 140-2 validated encryption to protect the confidentiality and integrity of the information being transmitted.
• Configuring their web browsers, mobile devices, etc., to enable communications through FIPS 140-2 validated encryption. CUSTOMER’s who enforce FDCC/USGCB settings will achieve FIPS 140-2 encryption for data transmitted to Microsoft Azure, and between their enablers and the Azure web services interface; strong encryption with FIPS-approved ciphers is still possible if workstations are not operating in FIPS mode.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.11',
    inheritance_type: 'validation_required',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Microsoft validates its cryptographic modules under the National Institute of Standards and Technology (NIST) Cryptographic Module Validation Program (CMVP). Multiple Microsoft products, including many cloud services, use these cryptographic modules.

Windows provides the security policy setting, System cryptography: Use FIPS-compliant algorithms for encryption, hashing, and signing. This setting is used by some Microsoft products to determine whether to run in FIPS mode. When this policy is turned on, the validated cryptographic modules in Windows will also operate in FIPS mode.

Through the Microsoft Security Development Lifecycle (SDL), all Azure services use FIPS 140-2 approved algorithms for data security because the operating system uses FIPS 140-2 approved algorithms while operating at a hyper scale cloud.

Azure Information Protection (AIP) is a cloud-based solution that enables organizations to discover, classify, and protect documents and emails by applying labels to content. Labels help identify CUI to ensure the right level of control can be enforced. Azure Information Protection is compliant with FIPS 140-2 when your tenant key size is 2048 bits, which is the default when the Azure Rights Management service is activated. 

Use Azure Key Vault to encrypt keys and small secrets like passwords that use keys stored in hardware security modules (HSMs). For more assurance, import or generate keys in HSMs, and Microsoft processes your keys in FIPS validated HSMs (hardware and firmware) - FIPS 140-2 Level 2 for vaults and FIPS 140-2 Level 3 for HSM pools. With Key Vault, Microsoft does not see or extract your keys. Monitor and audit your key use with Azure logging—pipe logs into Azure HDInsight or your security information and event management (SIEM) solution for more analysis and threat detection.

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.16',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `The storage location of the encryption keys and access control to those keys is central to an encryption at rest model. The keys need to be highly secured but manageable by specified users and available to specific services. For Azure services, Azure Key Vault is the recommended key storage solution and provides a common management experience across services. Keys are stored and managed in key vaults, and access to a key vault can be given to users or services. Azure Key Vault supports customer creation of keys or import of customer keys for use in customer-managed encryption key scenarios. Permissions to use the keys stored in Azure Key Vault, either to manage or to access them for Encryption at Rest encryption and decryption, can be given to Microsoft Entra ID accounts.

Software as a Service (SaaS) customers typically have encryption at rest enabled or available in each service. Microsoft 365 has several options for customers to verify or enable encryption at rest.

Platform as a Service (PaaS) customer's data typically resides in a storage service such as Blob Storage but may also be cached or stored in the application execution environment, such as a virtual machine. 

Like PaaS, IaaS solutions can leverage other Azure services that store data encrypted at rest. In these cases, you can enable the Encryption at Rest support as provided by each consumed Azure service. The Data encryption models: supporting services table enumerates the major storage, services, and application platforms and the model of Encryption at Rest supported.

Customer Responsibility
•	Protecting customer-controlled information at rest.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.4',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Azure Information Protection (AIP) is a cloud-based solution that enables organizations to discover, classify, and protect documents and emails by applying labels to content. AIP is part of the Microsoft Information Protection (MIP) solution, and extends the labeling and classification functionality provided by Microsoft 365. 

By default, built-in labeling is turned off in Office apps when the Azure Information Protection client is installed. Labels can be applied automatically by administrators who define rules and conditions, manually by users, or a combination where users are given recommendations. 

Microsoft Entra ID  offers a robust security set for preventing unauthorized and unintended information transfer via shared system resources. A good practice is to segregate duties within your team by setting up Role Based Access Control (RBAC) which will help you manage who has access to Azure resources. 

Ensure that the right users have the right access to the right resources by using intelligent cloud identity governance. Monitor and audit access to all resources while managing employee productivity.

Customer Responsibility
•preventing unauthorized and unintended information transfer between CUSTOMER-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.8',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `The Azure platform offers several mechanisms for keeping sessions secure including encryption in flight, and key management with Azure Key Vault. For more information see, Azure encryption overview. 

Microsoft gives customers the ability to use Transport Layer Security (TLS) protocol to protect data when it is traveling between the cloud services and customers. Microsoft datacenters negotiate a TLS connection with client systems that connect to Azure services. TLS provides strong authentication, message privacy, and integrity (enabling detection of message tampering, interception, and forgery), interoperability, algorithm flexibility, and ease of deployment and use.

Perfect Forward Secrecy (PFS) protects connections between customers’ client systems and Microsoft cloud services by unique keys. Connections also use RSA-based 2,048-bit encryption key lengths. This combination makes it difficult for someone to intercept and access data that is in transit.

Explore using Azure ExpressRoute to create private connections between Azure datacenters and infrastructure on your premises or in a colocation environment. ExpressRoute connection restricts public internet providing a private connection to Azure. 

Customer Responsibility
•Configuring all customer-deployed resources to communicate through FIPS 140-2 validated encryption to protect the confidentiality and integrity of the information being transmitted. 
•Configuring their web browsers, mobile devices, etc., to enable communications through FIPS 140-2 validated encryption. Customers who enforce FDCC/USGCB settings will achieve FIPS 140-2 encryption for data transmitted to Microsoft Azure, and between their enablers and the Azure web services interface; strong encryption with FIPS-approved ciphers is still possible if workstations are not operating in FIPS mode`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SI.L2-3.14.3',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `No Microsoft Coverage.

Customer Responsibility
•	Receiving security alerts, advisories, and directives from customer-defined external organizations on an ongoing basis`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SI.L2-3.14.6',
    inheritance_type: 'partial',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Connect your sources such as, Microsoft Defender for Endpoint to Sentinel for monitoring your organization. Enable Fusion technology based on machine learning, allowing Microsoft Sentinel to automatically detect multistage attacks by identifying combinations of anomalous behaviors and suspicious activities that are observed at various stages of the kill-chain. Based on these discoveries, Microsoft Sentinel generates incidents that would otherwise be difficult to catch. 
Customized for your environment, this detection technology not only reduces false positive rates but can also detect attacks with limited or missing information.

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Monitoring customer-deployed resources to detect attacks and indicators of potential attacks in accordance with customer-defined monitoring objectives; and unauthorized local, network, and remote connections.
•Monitoring customer-deployed resources, including the monitoring of inbound and outbound communications traffic at the customer-defined frequency, for unusual or unauthorized activities/conditions.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SI.L2-3.14.7',
    inheritance_type: 'full',
    source_title: 'Microsoft Purview — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft Purview — Product Placemat for CMMC',
    customer_actions: `Connect your sources such as, Microsoft Defender for Endpoint to Sentinel for monitoring your organization. Enable Fusion technology based on machine learning, allowing Microsoft Sentinel to automatically detect multistage attacks by identifying combinations of anomalous behaviors and suspicious activities that are observed at various stages of the kill-chain. Based on these discoveries, Microsoft Sentinel generates incidents that would otherwise be difficult to catch. Customized for your environment, this detection technology not only reduces false positive rates but can also detect attacks with limited or missing information.

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Monitoring customer-deployed resources to identify unauthorized use through customer-defined techniques and methods.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
]
