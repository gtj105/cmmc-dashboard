import type { SeedOverlayMapping } from './overlay-pack-helpers'

export const gccHighMappings: SeedOverlayMapping[] = [
  {
    practice_id: 'AC.L2-3.1.12',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Use Microsoft Entra ID to manage and secure identities by requiring single sign-on and multifactor authentication to protect your users. The recommended way to enable and use Microsoft Entra Multifactor Authentication is with Conditional Access Policies. 

Intune/Intune Suite integrates with Compliance Retrieval service (NAC 2.0) with network access control to allow companies to make access control decisions, such as; what devices are allowed to access corporate Wi-Fi or VPN resources. Using Compliance Retrieval service with network access control and conditional access, Intune/Intune Suite, users can create access control decisions. The controls will determine if users will be allowed or denied access to corporate Wi-Fi or VPN resources based on whether the device they are using is managed and compliant with Intune device compliance policies.

Explore using Azure ExpressRoute to create private connections between Azure datacenters and infrastructure on your premises or in a colocation environment. ExpressRoute connection restricts public internet providing a private connection to Azure. 

Customer Responsibility:
• Responsible for monitoring and controlling remote access methods for customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.19',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Encrypt CUI on mobile devices and mobile computing platforms using  Intune/Intune Suite with conditional access to require encryption, such as BitLocker for Windows 10 and later. Require app protection policy and approved client for cloud app access. Create and assign Microsoft Intune app protection policies to ensure that apps are protected with a PIN and Encrypted.

With Teams Premium, Teams admins can enable end-to-end meeting encryption for Teams meeting, ensuring that audio, video, and screen sharing features are encrypted.  

Via the embedded integration of Microsoft Copilot for Security allows users to review specific device configuration settings and provide information about the settings, enabling users to utilize secure and tested app protection policies for their devices.

Customer Responsibility
•	Developing processes and procedures for handling of CUI.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.21',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Using Intune, you can apply device configuration policies to Microsoft Entra ID user and/or device groups. The policies can also be set through the Device Installation CSP settings and the Device Installation GPOs. To protect your devices and corporate resources, you can use Microsoft Entra ID Conditional Access policies with Intune. 

Intune passes the results of your device compliance policies to Microsoft Entra ID, which then uses conditional access policies to enforce which devices and apps can access your corporate resources. 
Additionally, when managing devices in your organization, you want to create groups of settings that apply to different device groups. To prevent malware infections or data loss in your organization, you may want to block certain kinds of USB devices, such as a USB flash drive or camera, and allow other kinds of USB devices, such as a keyboard or mouse. Further, you may want to allow USB devices by specific device IDs. You can complete this task using Administrative Templates in Intune. The templates are built into Intune and do not require customization. 

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.3',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `You can secure confidential data and control information flows with Azure Information Protection. Azure Information Protection (AIP) is a cloud-based solution that helps an organization to classify and optionally, protect its documents and emails by applying labels. Labels can be applied automatically by administrators who define rules and conditions, manually by users, or a combination where users are given recommendations.

Microsoft Defender for Endpoint and Microsoft Intune/Intune Suite, which can be integrated with Microsoft Copilot for Security, offer various capabilities for managing and securing devices and their data. However, Microsoft Copilot for Security itself focuses on providing recommendations and insights rather than directly controlling or blocking actions like isolating machines or managing data flows​. While Microsoft Copilot for Security enhances the capabilities of security teams by providing AI-driven insights and automation, the practical implementation of limiting access to authorized transactions and functions is achieved through the configuration of the integrated security and management tools.

Customer Responsibility 
•Responsible for controlling the flow of information within customer-deployed resources and between interconnected systems.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.5',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
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
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
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
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Microsoft Azure offers a robust security set for preventing the use of non-privileged accounts from executing privileged functions. Best practice recommendation is to segregate duties within your team by setting up Role Based Access (RBAC) which will help you manage who has access to Azure resources. More granularity, you can restrict what the users can do with the resources and what areas they have access to. 

Additionally, you can secure privileged access within your organization using Privileged Identity Management (PIM). PIM will reduce risk to accounts with the most privileged access, resources and data. PIM enforces Just In Time access for these accounts which allows timed permission to be granted for specific resources.

Microsoft Copilot for Security integrates with products like Microsoft Entra to support concepts like least privilege and RBAC while limiting exposure of privileged accounts or roles. Microsoft Entra ID Protection applies the capabilities of Copilot for Security to summarize a user's risk level, provide insights relevant to the incident at hand, and provide recommendations for rapid mitigation. Risky user summarization provides admins and responders quick access to the most critical information in context to aid their investigation.

Customer Responsibility:
• Responsible for auditing the execution of privileged functions on customer-deployed resources.
• Responsible for ensuring that non-privileged users cannot execute privileged functions on customer-deployed resources`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.1',
    inheritance_type: 'full',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
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
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Visualize and monitor log data using Microsoft Sentinel which allows you to create custom workbooks across your data, and also comes with built-in workbook templates to allow you to quickly gain insights across your data as soon as you connect a data source. Connect logs from sources such as, Microsoft Entra ID, Microsoft Defender for Endpoint, O365 and Intune/Intune Suite to Sentinel for optimal visibility of your users’ activities. 

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Configuring Azure auditing capabilities on customer-deployed resources to generate audit records containing the following: what type of event occurred, when the event occurred, where the event occurred, the source of the event, the outcome of the event, and the identity of any subjects associated with the event.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.4',
    inheritance_type: 'validation_required',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Microsoft Sentinel classifies failures up front as either transient or permanent, based on the specific type of the failure and the circumstances that led to it. 

Customer Responsibility
•Providing alerts in response to audit processing failures (e.g., storage quota is reached, audit hardware/software errors) of customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.6',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Visualize and monitor log data using Microsoft Sentinel which allows you to create custom workbooks across your data, and also comes with built-in workbook templates to allow you to quickly gain insights across your data as soon as you connect a data source. 

Centralize sources to one place, such as Microsoft Sentinel SIEM solution. Connect logs from sources such as, Microsoft Entra ID, O365, Azure Defender, Microsoft Defender XDR, Microsoft Cloud App Security and Intune to Sentinel for optimal visibility to support analysis and reporting. 

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Providing an audit reduction and report generation capability for customer-deployed resources, including the support of on-demand audit review, analysis, and reporting requirements, and after-the-fact investigations of security incidents.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.8',
    inheritance_type: 'full',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Microsoft Sentinel uses Azure role-based access control (Azure RBAC) to provide built-in roles that can be assigned to users, groups, and services in Azure. Use Azure RBAC to create and assign roles within your security operations team to grant appropriate access 

Customer Responsibility
•Preventing unauthorized access to audit information and tools.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.9',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Use Azure RBAC to create and assign roles within your security operations team to grant appropriate access to Microsoft Sentinel to limit management of audit logging functionality to a subset of privileged users

Customer Responsibility
•Restricting the management of customer-controlled audit resources to authorized users.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CA.L2-3.12.3',
    inheritance_type: 'validation_required',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Azure Security Center is a unified infrastructure security management system that strengthens the security posture of your datacenters and provides advanced threat protection across your hybrid workloads in the cloud, be it Azure, any other cloud, or on-premises. Azure Security Center helps streamline the process for meeting regulatory compliance requirements, using the regulatory compliance dashboard. In the dashboard, Security Center provides insights into your compliance posture based on continuous assessments of your Azure environment. Security Center analyzes risk factors in your hybrid cloud environment according to security best practices. These assessments are mapped to compliance controls from a supported set of standards. In the Regulatory compliance dashboard, you can see the status of all the assessments within your environment in the context of a particular standard or regulation. As you act on the recommendations and reduce risk factors in your environment, your compliance posture improves.

Azure Blueprints provides an avenue to apply security controls, policies and resources. Just as a blueprint allows an engineer or an architect to sketch a project’s design parameters, Azure Blueprints enables cloud architects and central information technology groups to define a repeatable set of Azure resources that implements and adheres to an organization’s standards, patterns, and requirements. Azure Blueprints makes it possible for development teams to rapidly build and stand-up new environments with trust they are building within organizational compliance with a set of built-in components — such as networking — to speed up development and delivery. Azure Blueprints can actively apply controls with the deployIfNotExists option or can be leveraged for monitoring controls passively with the auditIfNotExists option.
Azure Policy
The CMMC L3 blueprint sample provides governance guardrails using Azure Policy that help you assess specific CMMC controls. This blueprint aids customers in deploying a core set of policies for any Azure-deployed architecture that must implement controls for CMMC L3. The associations between compliance domains, controls, and Azure Policy definitions for this compliance standard may change over time. 

Azure Policy definitions applicable to this specific control are as follows:
•	A vulnerability assessment solution should be enabled on your virtual machines
•	Adaptive application controls for defining safe applications should be enabled on your machines
•	Allowlist rules in your adaptive application control policy should be updated
•	An activity log alert should exist for specific Security operations
•	Auditing on SQL server should be enabled
•	Endpoint protection solution should be installed on virtual machine scale sets
•	Monitor missing Endpoint Protection in Azure Security Center
•	Security Center standard pricing tier should be selected
•	Vulnerability assessment should be enabled on SQL Managed Instance
•	Vulnerability assessment should be enabled on your SQL servers

These policies may help you assess compliance with the controls implemented to meet CMMC L3 practices; however, there often is not a one-to-one or complete match between a control and one or more policies. As such, compliant in Azure Policy refers only to the policy definitions themselves; this does not ensure you are fully compliant with all requirements of a practice.

Customer Responsibility
•	Identifying security controls to be continuously monitored.
•	Define a frequency to continuously monitor to support risk-based decision making.
•	Provide output of monitoring activities to stake holders.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.2',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite and Microsoft Entra ID work together to make sure only managed and compliant devices can access email, Microsoft 365 services, Software as a service (SaaS) apps, and on-premises apps. Additionally, you can set a policy in Microsoft Entra ID to only enable domain-joined computers or mobile devices that are enrolled in Intune/Intune Suite to access Microsoft 365 services.

Intune/Intune Suite via applications such as Enterprise App Management and Advanced Analytics allow administrators to configure and enforce security settings across various devices, including mobile phones, tablets, and laptops. These settings can include password requirements, encryption settings, and application permissions.

Microsoft Copilot for Security works with Intune/Intune Suite to enforce security configuration settings by analyzing current device configurations, policies and recommending enhancements or changings to improve the security posture of the devices. 

Customer Responsibility 
•Developing, documenting, and maintaining a baseline configuration of customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.5',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Using Azure role-based access control (Azure RBAC), users, groups, and applications from that directory can be granted access to resources in the Azure subscription. For example, a storage account can be placed in a resource group to control access to that specific storage account using Microsoft Entra ID. Access to Azure Storage can be controlled by Microsoft Entra ID , which enforces tenant isolation and implements robust measures to prevent access by unauthorized parties, including Microsoft insiders.

Copilot for Security must adhere to the RBAC roles and least privilege that is in place for an application. With Intune and Intune Suite, Copilot would only be able to access the data that an administrator has access to which includes the RBAC roles and Intune scope tags assigned to them. 

Microsoft 365 CoPilot is an artificial intelligence (AI) assistant integrated into Microsoft 365 applications like Word, Excel, PowerPoint, etc. It is designed to enhance productivity and creativity throughout the Microsoft 365 ecosystem of products. With regard to this practice objective, Microsoft 365 CoPilot can help brainstorm and generate documentation regarding physical and logical access restrictions.

Customer Responsibility 	
•Enforcing logical access restrictions when making changes to customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.6',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite and Microsoft Entra ID work together to make sure only managed and compliant devices can access email, Microsoft 365 services, Software as a service (SaaS) apps, and on-premises apps. Additionally, you can set a policy in Microsoft Entra ID to only enable domain-joined computers or mobile devices that are enrolled in Intune to access Microsoft 365 services.

Intune/Intune Suite can limit the software and functionalities available on each device to minimize security risks and ensure that devices only have the necessary capabilities for their intended roles via Endpoint Privilege Management, Enterprise App Management, and Advanced Analytics. 

Copilot for Security integrates with Microsoft Entra ID, with Copilot required to use the roles and permissions that an administrator has configured for a specific application. Copilot for Security can identify risky users in Microsoft Entra, and identify incorrect or conflicting policy/configuration settings for devices with Intune/Intune Suite. 

Customer Responsibility
•Configuring customer-deployed resources to only provide essential capabilities (e.g., disabling extraneous services that may be provided by default, using a system for a single function rather than a system supporting multiple functions, restricting or prohibiting unused or unnecessary functions, ports, protocols, or services).`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.1',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Microsoft Entra ID  offers a robust security set for Identifying information system users, processes acting on behalf of users or devices, such as; configuring identification and authentication controls.
 
Use Microsoft Entra ID  to manage and secure identities by requiring single sign-on and multifactor authentication to protect your users. 

Intune/Intune Suite can be configured to ensure that all devices are registered and authenticated before they can access organizational resources, as well as assist in identifying users, and associate device actions with specific user actions, via policy and device configurations. 

Microsoft Copilot for Security integrates with Microsoft Entra ID, as Copilot is required to use the established identifiers, roles and their permissions configured within Entra ID to perform specific functions and actions within the applications enhanced by Copilot. 

Customer Responsibility:
• Uniquely identifying and authenticating organizational users
• Federal user entities are responsible for properly identifying and authenticating federal users via ADFS`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.10',
    inheritance_type: 'full',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Store and transmit cryptographically protected passwords using Key Vault. Using the Azure portal, you can create your Key Vault. You can securely store and access secrets, such as API keys, passwords, certificates, or cryptographic keys. This is useful for websites, apps, and background processes where the application should not have access to credentials.

Customer Responsibility
•Employing password-based authentication, which stores and transmits cryptographically-protected passwords, for customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.2',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Microsoft Entra ID  offers a robust security set for verifying the identities of users, processes or devices before allowing access to organizational information systems by configuring identification and authentication controls.

Use Microsoft Entra ID  to manage and secure identities by requiring single sign-on and Azure Multi-Factor Authentication to protect your users. The recommended way to enable and use Microsoft Entra Multifactor Authentication is with Conditional Access Policies.

Copilot for Security must adhere to the RBAC roles and least privilege that is in place for an application. With Intune and Intune Suite, Copilot would only be able to access the data that an administrator has access to which includes the RBAC roles and Intune scope tags assigned to them.

Customer Responsibility:
• Implementing device identification and authentication prior to establishing a connection.
• Federal user entities, as well as other customers using identity federation, are responsible for federal/customer user authenticator management and content.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.3',
    inheritance_type: 'full',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Configure Conditional Access policies to require MFA for all users using the Azure portal. Configure device management policies using Intune/Intune Suite to enforce Microsoft Entra Multifactor Authentication for devices. Creating a compliance policy will define the rules and settings that a user’s device must meet to be compliant. Combine this with Conditional Access to enable the ability to block users and devices that do not meet the rules. 

Customer Responsibility
•Implementing multifactor authentication for network access to privileged accounts.
•Implementing multifactor authentication for network access to non-privileged accounts.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.4',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `All Microsoft Entra ID authentication methods at Authentication Assurance Level 2 & 3 use either nonce or challenges and are resistant to replay attacks. Configure Conditional Access policies to require MFA for all users using the Azure portal. Configure device management policies using Intune/Intune Suite to enforce Microsoft Entra Multifactor Authentication for devices. Creating a compliance policy will define the rules and settings that a user’s device must meet to be compliant. Combine this with Conditional Access to enable the ability to block users and devices that do not meet the rules. 

Microsoft Copilot for Security integrates with Intune/Intune Suite by providing recommendations for security enhancements for device and policy configurations such as multi-factor authentication where it is not in place or where the policy or device configuration is improperly configured. 

Customer Responsibility
•Implementing replay-resistant authentication mechanisms for network access to privileged accounts.
•Implementing replay-resistant authentication mechanisms for network access to non-privileged accounts.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.5',
    inheritance_type: 'full',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Assign and manage individual account identifiers and status in Microsoft Entra ID  in accordance with existing organizational policies. Take appropriate action on those user accounts by removing their privileged access rights or by deleting the account. 

Govern access for external users in Microsoft Entra ID entitlement management You can manage the lifecycle of external users by blocking their access after a defined period. Ensure that organizational policy maintains all accounts that remain in the disabled state for a defined period, after which they can be removed.

Customer Responsibility
•Preventing identifier reuse for the customer-defined time period.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.6',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Use activity filters and create action policies with Microsoft Defender for Identity in Microsoft Cloud App Security. Assess dormant sensitive entities as part of your organizations security policy. Organizations that fail to secure their dormant user accounts leave the door unlocked to their sensitive data safe. 

Assign and manage individual account identifiers and status in Microsoft Entra ID  in accordance with existing organizational policies. Take appropriate action on those user accounts by removing their privileged access rights or by deleting the account. 

Govern access for external users in Microsoft Entra ID entitlement management You can manage the lifecycle of external users by blocking their access after a defined period. Ensure that organizational policy maintains all accounts that remain in the disabled state for a defined period, after which they can be removed.

Customer Responsibility
•Disabling identifiers after a customer-defined time period of inactivity.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.7',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Use Microsoft Entra ID  to configure a custom password policy and Microsoft Entra ID Password Protection. To meet this requirement, the policy should enforce complexity requirements. The passwords must meet complexity requirements policy setting determines whether passwords must meet a series of strong-password guidelines.

Customer Responsibility
•Enforcing password complexity requirements (i.e., case sensitivity; number of characters; and the mix of upper-case letters, lower-case letters, numbers, and special characters, including minimum requirements for each type).`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IR.L2-3.6.1',
    inheritance_type: 'none',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
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
    practice_id: 'MP.L2-3.8.9',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
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
    practice_id: 'SC.L2-3.13.16',
    inheritance_type: 'validation_required',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `The storage location of the encryption keys and access control to those keys is central to an encryption at rest model. The keys need to be highly secured but manageable by specified users and available to specific services. For Azure services, Azure Key Vault is the recommended key storage solution and provides a common management experience across services. Keys are stored and managed in key vaults, and access to a key vault can be given to users or services. Azure Key Vault supports customer creation of keys or import of customer keys for use in customer-managed encryption key scenarios. Permissions to use the keys stored in Azure Key Vault, either to manage or to access them for Encryption at Rest encryption and decryption, can be given to Microsoft Entra ID accounts.

Software as a Service (SaaS) customers typically have encryption at rest enabled or available in each service. Microsoft 365 has several options for customers to verify or enable encryption at rest.

Platform as a Service (PaaS) customer's data typically resides in a storage service such as Blob Storage but may also be cached or stored in the application execution environment, such as a virtual machine. 

Like PaaS, IaaS solutions can leverage other Azure services that store data encrypted at rest. In these cases, you can enable the Encryption at Rest support as provided by each consumed Azure service. The Data encryption models: supporting services table enumerates the major storage, services, and application platforms and the model of Encryption at Rest supported.

Customer Responsibility
•	Protecting customer-controlled information at rest.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.8',
    inheritance_type: 'full',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
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
    practice_id: 'SI.L2-3.14.2',
    inheritance_type: 'partial',
    source_title: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Microsoft 365 GCC High — Product Placemat for CMMC',
    customer_actions: `Help protect your web apps from malicious attacks and common web vulnerabilities, such as SQL injection and cross-site scripting. Configure and enable Azure Web Application Firewall on your web application. Then, centrally define your rules and reuse them across all the web apps that you need to protect. 

Microsoft Antimalware for Azure is a single-agent solution for applications and tenant environments, designed to run in the background without human intervention. Protection may be deployed based on the needs of application workloads, with either basic secure-by-default or advanced custom configuration, including antimalware monitoring. The solution can remediate threats such as malicious code as it scans for vulnerabilities. 

When you integrate Intune with Microsoft Defender for Endpoint, you can take advantage of Microsoft Defender for Endpoints Threat & Vulnerability Management (TVM) and use Intune to remediate endpoint weakness identified by TVM. Integration can help you prevent security breaches and limit the impact of breaches within an organization. Turn tamper protection on (or off) for all or part of your organization using Intune/Intune Suite Fine-tune tamper protection settings in your organization. Manage tamper protection for your organization using Intune/Intune Suite. Bad actors like to disable your security features to get easier access to your data, to install malware, or to otherwise exploit your data, identity, and devices.

Customer Responsibility: 
• Protecting customer-deployed resources against malicious code by using code protection mechanisms at entry and exit points to detect and eradicate malicious code (e.g., viruses, malware, rootkits, worms, and scripts).`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
]
