import type { SeedOverlayMapping } from './overlay-pack-helpers'

export const azureGovernmentMappings: SeedOverlayMapping[] = [
  {
    practice_id: 'AC.L2-3.1.1',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `It is good practice to assign permissions using the principle of least permissions; this involves giving users the exact permissions they need to do their jobs properly. Users, groups, and applications are added to roles in Azure, and those roles have certain permissions. You can use the built-in roles that Azure offers, or you can create custom roles in RBAC.

RBAC helps in the creation and assignment of different permissions to different identities. This helps in segregating duties within teams, rather than everyone having all permissions. RBAC helps in making people responsible for their job because others might not even have the necessary access to perform it. It should be noted that providing permissions at a greater scope automatically ensures that child resources inherit those permissions. For example, providing an identity with read access for a resource group means that the identity will have read access to all the resources within that group, too.

Intune Suite's Endpoint Privilege Management requires Intune role-based access control roles with the correct permissions and sufficient rights to complete the desired tasks. Endpoint Privilege Management comes with pre-built roles and permissions, and allows users to set up their own custom built roles and permissions as well. 

Customer Responsibility:
•	 Responsible for authorizing access to the customer system.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.10',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Configure screen lock settings using Intune/Intune Suite. Enforcing controls using conditional access to only grant access to resources if devices are marked as compliant. 
By default, Microsoft Entra ID  obscures all passwords. Microsoft’s Password boxes conceal the characters typed into it for purposes of privacy. By default, the password box provides a way for the user to view their password by holding down a reveal button. 

You can disable this feature for Windows 10 using policy as an added security measure to ensure your password can not be displayed on the login screen

Via the embedded integration of Microsoft Copilot for Security, Copilot provides secure and tested policies that avoid conflicts with other policies chosen for the environment when users configure their devices, highlighting misconfigurations and providing recommendations on what to do about them. These policy configurations would include requirements such as session lock. 

Customer Responsibility
•	Responsible for incorporating a session lock on all customer-deployed resources.
•	Responsible for concealing previously visible information when a session lock is initiated on customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.11',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Implement automatic user session re-evaluation with Microsoft Entra ID features such as Risk-Based Conditional Access and Continuous Access Evaluation. Inactivity conditions can be implemented at a device level as described in:
•	Sign-in risk-based Conditional Access
•	User risk-based Conditional Access
•	Continuous Access Evaluation

Additionally, having a lockout threshold limiting the number of unsuccessful login attempts will protect against threats such as, Brute Force Attacks by automatically locking the account after a specified number of attempts. Default lockout threshold is set to 10 failed sign-ins before the first lockout occurs. It is important to customize the lockout threshold to fit your business requirements using Microsoft Entra ID smart lockout .

Intune/Intune Suite via the embedded integration of Microsoft Copilot for Security allows users to review specific device configuration settings and provide information about the settings, enabling users to utilize secure and tested configuration settings. These policy configurations would include requirements such as setting the parameters for account lockout due to user inactivity.  

Customer Responsibility:
• Responsible for defining and enforcing events or conditions requiring the termination of a user session on customer-deployed resources`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.12',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Use Microsoft Entra ID to manage and secure identities by requiring single sign-on and multifactor authentication to protect your users. The recommended way to enable and use Microsoft Entra Multifactor Authentication is with Conditional Access Policies. 

Intune/Intune Suite integrates with Compliance Retrieval service (NAC 2.0) with network access control to allow companies to make access control decisions, such as; what devices are allowed to access corporate Wi-Fi or VPN resources. Using Compliance Retrieval service with network access control and conditional access, Intune/Intune Suite, users can create access control decisions. The controls will determine if users will be allowed or denied access to corporate Wi-Fi or VPN resources based on whether the device they are using is managed and compliant with Intune device compliance policies.

Explore using Azure ExpressRoute to create private connections between Azure datacenters and infrastructure on your premises or in a colocation environment. ExpressRoute connection restricts public internet providing a private connection to Azure. 

Customer Responsibility:
• Responsible for monitoring and controlling remote access methods for customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.13',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Use Microsoft Entra ID to manage and secure identities by requiring single sign-on and multifactor authentication to protect your users. The recommended way to enable and use Microsoft Entra Multifactor Authentication is with Conditional Access Policies. Learn how to Create a Conditional Access Policy. 

Intune/Intune Suite integrates with Compliance Retrieval service (NAC 2.0) with network access control to allow companies to make access control decisions, such as; what devices are allowed to access corporate Wi-Fi or VPN resources. Using Compliance Retrieval service with network access control and conditional access, Intune/Intune Suite, users can create access control decisions. The controls will determine if users will be allowed or denied access to corporate Wi-Fi or VPN resources based on whether the device they are using is managed and compliant with Intune device compliance policies

Customer Responsibility:
• Responsible for implementing cryptographic mechanisms (e.g., TLS) to protect remote access sessions to customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.14',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Using Azure Bastion protects your virtual machines from exposing RDP/SSH ports to the outside world, while still providing secure access using RDP/SSH. Using Azure Bastion, you can securely and seamlessly connect to your virtual machines over SSL directly in the Azure portal. To set up an Azure Bastion host, see Create a bastion host

Create a VPN Gateway that lets you connect to your virtual network from a remote location. There are different configurations available for VPN gateway connections.

Intune/Intune Suite integrates with Compliance Retrieval service (NAC 2.0) with network access control to allow companies to make access control decisions, such as; what devices are allowed to access corporate Wi-Fi or VPN resources. Using Compliance Retrieval service with network access control and conditional access, Intune/Intune Suite, users can create access control decisions. The controls will determine if users will be allowed or denied access to corporate Wi-Fi or VPN resources based on whether the device they are using is managed and compliant with Intune device compliance policies.

Customer Responsibility:
• Responsible for routing remote access connections to customer-deployed resources through managed network access control points.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.15',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Azure offers a robust security set for employing the principle of least privilege. Best practice recommendation is to segregate duties within your team by setting up Role Based Access (RBAC) which will help you manage who has access to Azure resources. More granularity, you can restrict what the users can do with the resources and what areas they have access to. 

Additionally, you can secure privileged access within your organization using Privileged Identity Management (PIM). PIM will reduce risk to accounts with access to the most privileged access, resources and data. PIM enforces Just In Time access for these accounts which allows timed permission to be granted for specific resources.

In the context of Microsoft Copilot for Security and the broader Microsoft security ecosystem, the principle of least privilege and RBAC are applied through various integrated products and services, such as Microsoft Defender, Microsoft Intune, and Microsoft Entra. These tools offer comprehensive capabilities for defining and enforcing granular access controls based on user roles and conditions.

Customer Responsibility: 
• Responsible for authorizing privileged commands and access to security-relevant information via remote access for customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.16',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite integrates with Compliance Retrieval service (NAC 2.0) with network access control to allow companies to make access control decisions, such as; what devices are allowed to access corporate Wi-Fi or VPN resources. Using Compliance Retrieval service with network access control and conditional access, Intune/Intune Suite, users can create access control decisions. The controls will determine if users will be allowed or denied access to corporate Wi-Fi or VPN resources based on whether the device they are using is managed and compliant with Intune device compliance policies.

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.17',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite integrates with Compliance Retrieval service (NAC 2.0) with network access control to allow companies to make access control decisions, such as; what devices are allowed to access corporate Wi-Fi or VPN resources. Using Compliance Retrieval service with network access control and conditional access, Intune/Intune Suite, users can create access control decisions. The controls will determine if users will be allowed or denied access to corporate Wi-Fi or VPN resources based on whether the device they are using is managed and compliant with Intune device compliance policies.

Additionally, using Microsoft Intune built-in Wi-Fi settings called a “profile”, you can deploy specific Wi-Fi connection requirements to users with supported devices in your organization. Intune/Intune Suite offers many features, including authenticating to your network, using a pre-shared key for encryption and more. 

Customer Responsibility
•Responsible for the separation of duties across customer-controlled accounts.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.18',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite integrates with Compliance Retrieval service (NAC 2.0) with network access control to allow companies to make access control decisions, such as; what devices are allowed to access corporate Wi-Fi or VPN resources. Using Compliance Retrieval service with network access control and conditional access, Intune/Intune Suite, users can create access control decisions. The controls will determine if users will be allowed or denied access to corporate Wi-Fi or VPN resources based on whether the device they are using is managed and compliant with Intune device compliance policies.

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.19',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Block access by location with Microsoft Entra ID Conditional access to control and limit connections to and use of external information systems.

Customer Responsibility:
• Responsible for establishing terms and conditions allowing authorized individuals to access the customer-deployed resources from external information systems.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.21',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Using Intune, you can apply device configuration policies to Microsoft Entra ID user and/or device groups. The policies can also be set through the Device Installation CSP settings and the Device Installation GPOs. To protect your devices and corporate resources, you can use Microsoft Entra ID Conditional Access policies with Intune. 

Intune passes the results of your device compliance policies to Microsoft Entra ID, which then uses conditional access policies to enforce which devices and apps can access your corporate resources. 
Additionally, when managing devices in your organization, you want to create groups of settings that apply to different device groups. To prevent malware infections or data loss in your organization, you may want to block certain kinds of USB devices, such as a USB flash drive or camera, and allow other kinds of USB devices, such as a keyboard or mouse. Further, you may want to allow USB devices by specific device IDs. You can complete this task using Administrative Templates in Intune. The templates are built into Intune and do not require customization. 

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.22',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `You can secure confidential data and control information flows with Azure Information Protection. Azure Information Protection (AIP) is a cloud-based solution that helps an organization to classify and optionally, protect its documents and emails by applying labels. Labels can be applied automatically by administrators who define rules and conditions, manually by users, or a combination where users are given recommendations.

Microsoft Defender for Endpoint and Microsoft Intune/Intune Suite, which can be integrated with Microsoft Copilot for Security, offer various capabilities for managing and securing devices and their data. However, Microsoft Copilot for Security itself focuses on providing recommendations and insights rather than directly controlling or blocking actions like isolating machines or managing data flows​. While Microsoft Copilot for Security enhances the capabilities of security teams by providing AI-driven insights and automation, the practical implementation of limiting access to authorized transactions and functions is achieved through the configuration of the integrated security and management tools.

Customer Responsibility 
•Responsible for controlling the flow of information within customer-deployed resources and between interconnected systems.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.4',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Azure offers a robust security set for employing separation of duties. Best practice recommendation is to segregate duties within your team by setting up Role Based Access (RBAC) which will help you manage who has access to Azure resources. More granularity, you can restrict what the users can do with the resources and what areas they have access to. 

Additionally, you can secure privileged access within your organization using Privileged Identity Management (PIM). PIM will reduce risk to accounts with access to the most privileged access, resources and data. PIM enforces Just In Time access for these accounts which allows timed permission to be granted for specific resources

Customer Responsibility
•Responsible for the separation of duties across customer-controlled accounts.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.5',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Azure offers a robust security set for preventing the use of non-privileged accounts from executing privileged functions. Best practice recommendation is to segregate duties within your team by setting up Role Based Access (RBAC) which will help you manage who has access to Azure resources. More granularity, you can restrict what the users can do with the resources and what areas they have access to. 

Additionally, you can secure privileged access within your organization using Privileged Identity Management (PIM). PIM will reduce risk to accounts with the most privileged access, resources and data. PIM enforces Just In Time access for these accounts which allows timed permission to be granted for specific resources.

Microsoft Copilot for Security integrates with products like Microsoft Entra to support concepts like least privilege and RBAC while limiting exposure of privileged accounts or roles. Microsoft Entra ID Protection applies the capabilities of Copilot for Security to summarize a user's risk level, provide insights relevant to the incident at hand, and provide recommendations for rapid mitigation. Risky user summarization provides admins and responders quick access to the most critical information in context to aid their investigation.

Customer Responsibility:
• Responsible for auditing the execution of privileged functions on customer-deployed resources.
• Responsible for ensuring that non-privileged users cannot execute privileged functions on customer-deployed resources`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.8',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft customers should consider two factors when implementing this control. They should determine the threshold for how many consecutive times a failed login will be allowed before a lock out is implemented, and then determine what would be the duration of that lock out. Having three consecutive, unsuccessful logon attempts is a common setting. Organizations should set this number at a level that fits their risk profile. Fewer unsuccessful attempts provide higher security. You can control the lockout duration using Microsoft Entra ID smart lockout.

Customer Responsibility
•	Responsible for enforcing a limit of consecutive failed login attempts on customer-deployed`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AC.L2-3.1.9',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `No Microsoft Coverage.

Customer Responsibility
•	Providing role-based security training to users before authorizing access to customer-deployed resources or performing assigned duties. 
•	Providing role-based security training to all identified roles when required by changes to customer-deployed resources.
•	Providing ongoing, periodic role-based security training to all identified roles.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.1',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Visualize and monitor log data using Microsoft Sentinel which allows you to create custom workbooks across your data, and also comes with built-in workbook templates to allow you to quickly gain insights across your data as soon as you connect a data source. Connect logs from sources such as, Microsoft Entra ID, Microsoft Defender for Endpoint, O365 and Intune/Intune Suite to Sentinel for optimal visibility of your users’ activities. 

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Configuring Azure auditing capabilities on customer-deployed resources to generate audit records containing the following: what type of event occurred, when the event occurred, where the event occurred, the source of the event, the outcome of the event, and the identity of any subjects associated with the event.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.3',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Visualize and monitor log data using Microsoft Sentinel which allows you to create custom workbooks across your data, and also comes with built-in workbook templates to allow you to quickly gain insights across your data as soon as you connect a data source. 

Connect logs from sources such as, Microsoft Entra ID, Microsoft Defender XDR, O365 and Intune to Sentinel for optimal visibility of your users’ activities.

Customer Responsibility
•Reviewing and updating the customer-defined events for customer-deployed resources.
•Defining a process for determining when to review logged events to ensure that the current set remains necessary and sufficient.. (i.e., regular frequency, after incidents, after major system changes)
•Defining and updating event log types to ensure that the current set remains necessary and sufficient.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.4',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Sentinel classifies failures up front as either transient or permanent, based on the specific type of the failure and the circumstances that led to it. 

Customer Responsibility
•Providing alerts in response to audit processing failures (e.g., storage quota is reached, audit hardware/software errors) of customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.6',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Visualize and monitor log data using Microsoft Sentinel which allows you to create custom workbooks across your data, and also comes with built-in workbook templates to allow you to quickly gain insights across your data as soon as you connect a data source. 

Centralize sources to one place, such as Microsoft Sentinel SIEM solution. Connect logs from sources such as, Microsoft Entra ID, O365, Azure Defender, Microsoft Defender XDR, Microsoft Cloud App Security and Intune to Sentinel for optimal visibility to support analysis and reporting. 

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Providing an audit reduction and report generation capability for customer-deployed resources, including the support of on-demand audit review, analysis, and reporting requirements, and after-the-fact investigations of security incidents.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.8',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Sentinel uses Azure role-based access control (Azure RBAC) to provide built-in roles that can be assigned to users, groups, and services in Azure. Use Azure RBAC to create and assign roles within your security operations team to grant appropriate access 

Customer Responsibility
•Preventing unauthorized access to audit information and tools.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'AU.L2-3.3.9',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Use Azure RBAC to create and assign roles within your security operations team to grant appropriate access to Microsoft Sentinel to limit management of audit logging functionality to a subset of privileged users

Customer Responsibility
•Restricting the management of customer-controlled audit resources to authorized users.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CA.L2-3.12.1',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Azure Security Center is a unified infrastructure security management system that strengthens the security posture of your datacenters and provides advanced threat protection across your hybrid workloads in the cloud, be it Azure, any other cloud, or on-premises. 

Azure Security Center helps streamline the process for meeting regulatory compliance requirements, using the regulatory compliance dashboard.

In the dashboard, Security Center provides insights into your compliance posture based on continuous assessments of your Azure environment. Security Center analyzes risk factors in your hybrid cloud environment according to security best practices.

These assessments are mapped to compliance controls from a supported set of standards.

In the Regulatory compliance dashboard, you can see the status of all the assessments within your environment in the context of a particular standard or regulation. As you act on the recommendations and reduce risk factors in your environment, your compliance posture improves. 

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CA.L2-3.12.3',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    practice_id: 'CM.L2-3.4.1',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Security baselines for Azure focus on cloud-centric control areas. These controls are consistent with well-known security benchmarks, such as those described by the Center for Internet Security (CIS). Our baselines provide guidance for the control areas listed in the Azure Security Benchmark. The content is grouped by the security controls defined by the Azure Security Benchmark and the related guidance applicable to Azure Defender for IoT

Microsoft Intune reports allows you to monitor the health and activity of endpoints more effectively and proactively across your organization, and also provides other reporting data across Intune such as inventory. For example, you will be able to see reports about device compliance, device health, and device trends. In addition, you can create custom reports to obtain more specific data.

Microsoft Intune Suite can help enforce and maintain baseline configurations for devices and applications managed within an organization. It can ensure that all managed devices comply with pre-established security policies and configurations.

Microsoft Copilot for Security uses Intune's capabilities to gain more information about devices such as checking the compliance status of a device, determining if it is noncompliant and why it is noncompliant. When this data is integrated with Microsoft Defender, along with the device type, it assists the security administrator in making a determination of the best course of action for next steps. 

Customer Responsibility
•Developing, documenting, and maintaining a baseline configuration of customer-deployed resources.
•Developing and documenting an inventory of customer-deployed resources, that supports tracking and reporting, and includes any information the customer has deemed necessary to achieve effective accountability`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.2',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite and Microsoft Entra ID work together to make sure only managed and compliant devices can access email, Microsoft 365 services, Software as a service (SaaS) apps, and on-premises apps. Additionally, you can set a policy in Microsoft Entra ID to only enable domain-joined computers or mobile devices that are enrolled in Intune/Intune Suite to access Microsoft 365 services.

Intune/Intune Suite via applications such as Enterprise App Management and Advanced Analytics allow administrators to configure and enforce security settings across various devices, including mobile phones, tablets, and laptops. These settings can include password requirements, encryption settings, and application permissions.

Microsoft Copilot for Security works with Intune/Intune Suite to enforce security configuration settings by analyzing current device configurations, policies and recommending enhancements or changings to improve the security posture of the devices. 

Customer Responsibility 
•Developing, documenting, and maintaining a baseline configuration of customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.3',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    practice_id: 'CM.L2-3.4.4',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Analyze the security impact of changes prior to implementation by utilizing test environments. Use purpose-built, managed developer services like Azure DevTest Labs, GitHub Codespaces, and Windows Virtual Desktop to easily manage and optimize dev/test environments, tenants, and subscriptions, without sacrificing governance, cost controls, or security. This can uncover and mitigate potential problems before they occur. Configuration changes should be tested, validated and documented before installing them on the operational system.

Customer Responsibility 
•Analyzing proposed changes to customer-deployed resources to determine potential security impacts prior to implementation`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.5',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Using Azure role-based access control (Azure RBAC), users, groups, and applications from that directory can be granted access to resources in the Azure subscription. For example, a storage account can be placed in a resource group to control access to that specific storage account using Microsoft Entra ID. Access to Azure Storage can be controlled by Microsoft Entra ID , which enforces tenant isolation and implements robust measures to prevent access by unauthorized parties, including Microsoft insiders.

Copilot for Security must adhere to the RBAC roles and least privilege that is in place for an application. With Intune and Intune Suite, Copilot would only be able to access the data that an administrator has access to which includes the RBAC roles and Intune scope tags assigned to them. 

Microsoft 365 CoPilot is an artificial intelligence (AI) assistant integrated into Microsoft 365 applications like Word, Excel, PowerPoint, etc. It is designed to enhance productivity and creativity throughout the Microsoft 365 ecosystem of products. With regard to this practice objective, Microsoft 365 CoPilot can help brainstorm and generate documentation regarding physical and logical access restrictions.

Customer Responsibility 	
•Enforcing logical access restrictions when making changes to customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.6',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Intune/Intune Suite and Microsoft Entra ID work together to make sure only managed and compliant devices can access email, Microsoft 365 services, Software as a service (SaaS) apps, and on-premises apps. Additionally, you can set a policy in Microsoft Entra ID to only enable domain-joined computers or mobile devices that are enrolled in Intune to access Microsoft 365 services.

Intune/Intune Suite can limit the software and functionalities available on each device to minimize security risks and ensure that devices only have the necessary capabilities for their intended roles via Endpoint Privilege Management, Enterprise App Management, and Advanced Analytics. 

Copilot for Security integrates with Microsoft Entra ID, with Copilot required to use the roles and permissions that an administrator has configured for a specific application. Copilot for Security can identify risky users in Microsoft Entra, and identify incorrect or conflicting policy/configuration settings for devices with Intune/Intune Suite. 

Customer Responsibility
•Configuring customer-deployed resources to only provide essential capabilities (e.g., disabling extraneous services that may be provided by default, using a system for a single function rather than a system supporting multiple functions, restricting or prohibiting unused or unnecessary functions, ports, protocols, or services).`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.7',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Network security group contains security rules that allow or deny inbound network traffic to, or outbound network traffic from, several types of Azure resources. For each rule, you can specify source and destination, port, and protocol.

Intune and Microsoft Entra ID work together to make sure only managed and compliant devices can access email, Microsoft 365 services, Software as a service (SaaS) apps, and on-premises apps. Additionally, you can set a policy in Microsoft Entra ID to only enable domain-joined computers or mobile devices that are enrolled in Intune to access Microsoft 365 services.

Intune/Intune Suite can limit the software and functionalities available on each device to minimize security risks and ensure that devices only have the necessary capabilities for their intended roles via Endpoint Privilege Management, Enterprise App Management, and Advanced Analytics. 

Consider exploring Azure Security Center’s adaptive application controls. Security Center uses machine learning to analyze the applications running on your machines and create a list of the known-safe software. Allow lists are based on your specific Azure workloads that you can customize. When you have enabled and configured adaptive application controls, you will get security alerts if any application runs other than the ones you have defined as safe.
Requirements include Azure Defender for servers. 

While Copilot for Security does not implement rules and restrictions for functions, ports, protocols or devices, it can identify incorrect or conflicting policy/configuration settings for devices with Intune/Intune Suite, and provide device analysis and assist in device troubleshooting. 

Customer Responsibility
•Configuring customer-deployed resources to only provide essential capabilities (e.g., disabling extraneous services that may be provided by default, using a system for a single function rather than a system supporting multiple functions). 
•Prohibiting or restricting the use of specific functions, ports, protocols, and/or services to provide least functionality.
•Organizational processes for reviewing and disabling nonessential programs, functions, ports, protocols, or services to include a defined frequency of reviews.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.8',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Consider exploring Azure Security Center’s adaptive application controls. Security Center uses machine learning to analyze the applications running on your machines and create a list of the known-safe software. Allow lists are based on your specific Azure workloads that you can customize. When you have enabled and configured adaptive application controls, you will get security alerts if any application runs other than the ones you have defined as safe. Requirements include Azure Defender for servers.

Customer Responsibility
•Identifying software programs authorized to execute on customer-deployed resources.
•Employing a deny-all, permit-by-exception policy to allow the execution of authorized software programs on customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'CM.L2-3.4.9',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Consider exploring Azure Security Center’s adaptive application controls. Security Center uses machine learning to analyze the applications running on your machines and create a list of the known-safe software. Allow lists are based on your specific Azure workloads that you can customize. When you have enabled and configured adaptive application controls, you will get security alerts if any application runs other than the ones you have defined as safe. Requirements include Azure Defender for servers.

Intune Suite has applications such as Enterprise App Management that can be configured for app specific rules used to detect the presence of the Enterprise App Catalog  where users can choose to either manually configure the detection rules or use a custom script to detect the presence of the app before installing the app. The Enterprise App Catalog includes apps that self update, Intune ensures that the app is at least a target minimum version and considers the app installed if the detected version of the app is at or above the minimum version. The apps contained within the Enterprise App Catalog are Win32 apps. However, it is important to note that Microsoft does not provide security around the content provided in the Enterprise App Catalog  and it is up to the user to ensure it meets security and compliance requirements.

Customer Responsibility 
•Establishing a policy governing the installation of software on customer-deployed resources by users.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.1',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Store and transmit cryptographically protected passwords using Key Vault. Using the Azure portal, you can create your Key Vault. You can securely store and access secrets, such as API keys, passwords, certificates, or cryptographic keys. This is useful for websites, apps, and background processes where the application should not have access to credentials.

Customer Responsibility
•Employing password-based authentication, which stores and transmits cryptographically-protected passwords, for customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.11',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `By default, Microsoft Entra ID  obscures all passwords. Microsoft’s Password boxes conceal the characters typed into it for purposes of privacy. By default, the password box provides a way for the user to view their password by holding down a reveal button. 

You can disable this feature for Windows 10 using policy as an added security measure to ensure your password can not be displayed on the login screen. 

Customer Responsibility
•Obscuring authentication feedback information during the authentication process for any customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.2',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    inheritance_type: 'validation_required',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Configure Conditional Access policies to require MFA for all users using the Azure portal. Configure device management policies using Intune/Intune Suite to enforce Microsoft Entra Multifactor Authentication for devices. Creating a compliance policy will define the rules and settings that a user’s device must meet to be compliant. Combine this with Conditional Access to enable the ability to block users and devices that do not meet the rules. 

Customer Responsibility
•Implementing multifactor authentication for network access to privileged accounts.
•Implementing multifactor authentication for network access to non-privileged accounts.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.4',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `All Microsoft Entra ID authentication methods at Authentication Assurance Level 2 & 3 use either nonce or challenges and are resistant to replay attacks. Configure Conditional Access policies to require MFA for all users using the Azure portal. Configure device management policies using Intune/Intune Suite to enforce Microsoft Entra Multifactor Authentication for devices. Creating a compliance policy will define the rules and settings that a user’s device must meet to be compliant. Combine this with Conditional Access to enable the ability to block users and devices that do not meet the rules. 

Microsoft Copilot for Security integrates with Intune/Intune Suite by providing recommendations for security enhancements for device and policy configurations such as multi-factor authentication where it is not in place or where the policy or device configuration is improperly configured. 

Customer Responsibility
•Implementing replay-resistant authentication mechanisms for network access to privileged accounts.
•Implementing replay-resistant authentication mechanisms for network access to non-privileged accounts.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.5',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Assign and manage individual account identifiers and status in Microsoft Entra ID  in accordance with existing organizational policies. Take appropriate action on those user accounts by removing their privileged access rights or by deleting the account. 

Govern access for external users in Microsoft Entra ID entitlement management You can manage the lifecycle of external users by blocking their access after a defined period. Ensure that organizational policy maintains all accounts that remain in the disabled state for a defined period, after which they can be removed.

Customer Responsibility
•Preventing identifier reuse for the customer-defined time period.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.6',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Use Microsoft Entra ID  to configure a custom password policy and Microsoft Entra ID Password Protection. To meet this requirement, the policy should enforce complexity requirements. The passwords must meet complexity requirements policy setting determines whether passwords must meet a series of strong-password guidelines.

Customer Responsibility
•Enforcing password complexity requirements (i.e., case sensitivity; number of characters; and the mix of upper-case letters, lower-case letters, numbers, and special characters, including minimum requirements for each type).`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.8',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Use Microsoft Entra ID  to configure a custom password policy and Microsoft Entra ID Password Protection. To meet this requirement, use a combination of security settings; the policy should enforce password history and have a minimum password age. For example, if you configure the Enforce password history policy setting to ensure that users cannot reuse any of their last 12 passwords, but you do not configure the Minimum password age policy setting to a number that is greater than 0, users could change their password 13 times in a few minutes and reuse their original password.

Customer Responsibility
•Employing password-based authentication to customer-deployed resources and defining the number of password generations that are prohibited from reuse (e.g., 10 most recent passwords may not be reused when creating a new password).`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IA.L2-3.5.9',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `When creating a new user or resetting their password using Microsoft Entra ID , a temporary password is auto-generated for the user. The temporary password never expires. The user will be required to change the password during the next sign-in process. 

The time a user must wait to change the password is determined by password policy settings, specifically the minimum password age. The Minimum password age policy setting determines the period of time (in days) that a password must be used before the user can change it. You can set a value between 1 and 998 days, or you can allow password changes immediately by setting the number of days to 0. 

Customer Responsibility
•Employing password-based authentication to customer-deployed resources, including the ability to issue users a temporary password with the requirement to immediately change to a permanent password upon login`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'IR.L2-3.6.1',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    practice_id: 'MA.L2-3.7.1',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Performing controlled maintenance ensures uptime through established processes such as change and configuration management. Maintenance windows are an important time to apply critical security updates and patches. Maintenance windows also incur risk as systems could crash without proper testing or authorized time windows. Azure Maintenance Control facilitates control of maintenance operations in the platform.

Manage platform updates, that do not require a reboot, using maintenance control. Azure frequently updates its infrastructure to improve reliability, performance, security or launch new features. Most updates are transparent to users. Some sensitive workloads, like gaming, media streaming, and financial transactions, can’t tolerate even few seconds of a VM freezing or disconnecting for maintenance. Maintenance control gives you the option to wait on platform updates and apply them within a 35-day rolling window.
Maintenance control lets you decide when to apply updates to your isolated VMs. With maintenance control, you can:
•	Batch updates into one update package.
•	Wait up to 35 days to apply updates.
•	Automate platform updates for your maintenance window using Azure Functions.
•	Maintenance configurations work across subscriptions and resource groups.
To apply maintenance control to an Azure VM, the VM must be on a dedicated host or created with an isolated VM size. After 35 days, an update will be automatically applied. The controlling user must have resource contributor access.

Customer Responsibility
•Responsible for scheduling, performing, documenting, and reviewing remote maintenance and repair records for all customer-deployed operating systems in accordance with organizational requirements.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MA.L2-3.7.2',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Use RBAC to control access to control personnel access maintenance activities. By limiting roles and scopes, you limit what resources are at risk. Microsoft Entra ID RBAC supports over 65 built-in roles. There are Microsoft Entra ID roles to manage directory objects like users, groups, and applications, and also to manage Microsoft 365 services like Exchange, SharePoint, and Intune.
 
MFA helps safeguard access to data and applications. It provides an additional layer of security using a second form of authentication. Organizations can use Conditional Access to make the solution fit their specific needs. Microsoft Entra Multifactor Authentication is deployed by enforcing policies with Conditional Access.

Additionally, performing controlled maintenance ensures uptime through established processes such as change and configuration management. Maintenance windows are an important time to apply critical security updates and patches. Maintenance windows also incur risk as systems could crash without proper testing or authorized time windows. Azure Maintenance Control facilitates control of maintenance operations in the platform.

Customer Responsibility	
•Responsible for approving, controlling and monitoring system maintenance tools used on customer-deployed operating systems.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MA.L2-3.7.5',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Customer Responsibility
•Responsible for using strong authenticators when establishing non-local maintenance and diagnostic sessions on customer-deployed operating systems.
•Responsible for terminating session and network connections when non-local maintenance is completed on customer-deployed operating systems.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MA.L2-3.7.6',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `You can supervise maintenance personnel with Microsoft Entra ID Privileged Identity Management. This feature provides tight control over administrative rights including conditional access, eligibility windows, global admin approvals, admin time windows and logging.

Most operations, support, and troubleshooting performed by Microsoft personnel and sub-processors do not require access to customer data. In those rare circumstances where such access is required, Customer Lockbox for Microsoft Azure provides an interface for customers to review and approve or reject customer data access requests. It is used in cases where a Microsoft engineer needs to access customer data, whether in response to a customer-initiated support ticket or a problem identified by Microsoft.

Additionally, Azure Bastion is a fully managed PaaS service that provides secure and seamless RDP and SSH access to your virtual machines directly through the Azure Portal. Azure Bastion is provisioned directly in your Virtual Network (VNet) and supports all VMs in your Virtual Network (VNet) using SSL without any exposure through public IP addresses.

Once the Bastion service is provisioned and deployed in your virtual network, you can use it to seamlessly connect to any VM in this virtual network. As users connect to workloads, Azure Bastion can be used to monitor the remote sessions and take quick management actions. Azure Bastion session monitoring lets you view which users are connected to which VMs. It shows the IP that the user connected from, how long they have been connected, and when they connected. The session management experience lets you select an ongoing session and force-disconnect or delete a session in order to disconnect the user from the ongoing session.

Customer Responsibility
•Managing maintenance personnel and designating organizational personnel with required access authorizations and technical competence to supervise the maintenance activities of personnel who do not possess the required access authorizations.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.1',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    practice_id: 'MP.L2-3.8.5',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `BitLocker To Go is BitLocker Drive Encryption on removable data drives. As with BitLocker, you can open drives that are encrypted by BitLocker To Go by using a password or smart card on another computer.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.8',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Requiring identifiable owners (e.g., individuals, organizations, or projects) for portable storage devices reduces the overall risk of using such technologies by allowing organizations to assign responsibility and accountability for addressing known vulnerabilities in the devices (e.g., insertion of malicious code). 

Microsoft recommends a layered approach to securing removable media, and Microsoft Defender for Endpoint provides multiple monitoring and control features to help prevent threats in unauthorized peripherals from compromising your devices. Discover plug and play connected events for peripherals in Microsoft Defender for Endpoint advanced hunting.

 To prevent malware infections or data loss, an organization may restrict USB drives and other peripherals. Allow or block removable devices based on granular configuration to deny write access to removable disks and approve or deny devices by using USB device IDs. Flexible policy assignment of device installation settings based on an individual or group of Microsoft Entra ID  users and devices. The controls can be set through the Intune Administrative Templates. Using Intune, you can apply device configuration policies to Microsoft Entra ID user and/or device groups. The above policies can also be set through the Device Installation CSP settings and the Device Installation GPOs.

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'MP.L2-3.8.9',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    practice_id: 'PE.L2-3.10.1',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Coverage for cloud-based services.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'PE.L2-3.10.2',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Coverage for cloud-based services.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'PE.L2-3.10.3',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Coverage for cloud-based services.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'PE.L2-3.10.4',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Coverage for cloud-based services.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'PE.L2-3.10.5',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Coverage for cloud-based services.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'PE.L2-3.10.6',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    practice_id: 'PS.L2-3.9.2',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `To protect organizational system containing CUI it is important to have controls in place that can identify users and remove access when needed. Microsoft Entra ID  is the cornerstone of identity in Azure. Microsoft Entra ID enables hybrid identities through Microsoft Entra ID Connect, an on-premises solution that is used to synchronize Active Directory identities with Microsoft Entra ID, as well as to deploy Active Directory Federation Services (ADFS).

RBAC helps in the creation and assignment of different permissions to different identities. This helps in segregating duties within teams, rather than everyone having all permissions. It is good practice to assign permissions using the principle of least permissions; this involves giving users the exact permissions they need to do their jobs properly. Users, groups, and applications are added to roles in Azure, and those roles have certain permissions. You can use the built-in roles that Azure offers, or you can create custom roles in RBAC.

Conditional Access allows you to set up access policies to prohibit a specific activity, as well as to trigger MFA according to rules that you define). You may target conditional access policies toward specific users or groups, or to specific apps.

Customer Responsibility: 
• Appropriately terminating customer personnel within a customer-defined time period.
• Appropriately transferring personnel and reviewing current logical and physical access authorizations to customer-deployed resources/facilities when individuals are reassigned or transferred.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.1',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    practice_id: 'SC.L2-3.13.10',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Secure key management is essential to protect data in the cloud. Use Azure Key Vault to encrypt keys and small secrets like passwords that use keys stored in hardware security modules (HSMs). For more assurance, import or generate keys in HSMs, and Microsoft processes your keys in FIPS 140-2 Level 3 Thales Luna 7 HSM. 

Azure Dedicated HSM is a cloud-based service that provides HSMs hosted in Azure datacenters that are directly connected to a customer's virtual network. These HSMs are dedicated Thales Luna 7 HSM network appliances. They are deployed directly to a customers' private IP address space and Microsoft does not have any access to the cryptographic functionality of the HSMs. Only the customer has full administrative and cryptographic control over these devices. Customers are responsible for the management of the device and they can get full activity logs directly from their devices. Dedicated HSMs help customers meet compliance/regulatory requirements such as FIPS 140-2 Level 3, HIPAA, PCI-DSS, and eIDAS and many others. 
With Key Vault, Microsoft does not see or extract your keys. Monitor and audit your key use with Azure logging—pipe logs into Azure HDInsight or your security information and event management (SIEM) solution for more analysis and threat detection

Customer Responsibility
•Managing cryptographic keys used within CUSTOMER-deployed resources in accordance with CUSTOMER-defined requirements for key generation, distribution, storage, access, and destruction.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.11',
    inheritance_type: 'validation_required',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft validates its cryptographic modules under the National Institute of Standards and Technology (NIST) Cryptographic Module Validation Program (CMVP). Multiple Microsoft products, including many cloud services, use these cryptographic modules.

Windows provides the security policy setting, System cryptography: Use FIPS-compliant algorithms for encryption, hashing, and signing. This setting is used by some Microsoft products to determine whether to run in FIPS mode. When this policy is turned on, the validated cryptographic modules in Windows will also operate in FIPS mode.

Through the Microsoft Security Development Lifecycle (SDL), all Azure services use FIPS 140-2 approved algorithms for data security because the operating system uses FIPS 140-2 approved algorithms while operating at a hyper scale cloud.

Azure Information Protection (AIP) is a cloud-based solution that enables organizations to discover, classify, and protect documents and emails by applying labels to content. Labels help identify CUI to ensure the right level of control can be enforced. Azure Information Protection is compliant with FIPS 140-2 when your tenant key size is 2048 bits, which is the default when the Azure Rights Management service is activated. 

Use Azure Key Vault to encrypt keys and small secrets like passwords that use keys stored in hardware security modules (HSMs). For more assurance, import or generate keys in HSMs, and Microsoft processes your keys in FIPS validated HSMs (hardware and firmware) - FIPS 140-2 Level 2 for vaults and FIPS 140-2 Level 3 for HSM pools. With Key Vault, Microsoft does not see or extract your keys. Monitor and audit your key use with Azure logging—pipe logs into Azure HDInsight or your security information and event management (SIEM) solution for more analysis and threat detection.

No customer responsibility.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.12',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Remote activation of collaborative computing devices can be restricted by enforcing authentication mechanisms such as, Windows Hello for Business, Intune/Intune Suite and Microsoft Entra ID. Windows Hello for Business Windows stores biometric data that is used to implement Windows Hello securely on the local device only. The biometric data does not roam and is never sent to external devices or servers. Configure Windows Hello for Business is by Group Policy or Intune/Intune Suite policy. Because Windows Hello only stores biometric identification data on the device, there is no single collection point an attacker can compromise to steal biometric data.

Microsoft Intune Suite's add-on service, Remote Help, uses Intune RBAC to set the level of access a user helper is allowed and the level of help they can provide. Remote Help must be enabled, as it is not enabled by default in Intune tenants. If organizations choose to turn on Remote Help, its use is enabled tenant-wide, and requires users to be authenticated to your tenant when using Remote Help. To use Remote Help, both the helper and the sharer must sign in with a Microsoft Entra account from your organization, and the device must be enrolled in Remote Help. Before a helper connects to a user's device, the helper will see a non-compliance warning about that device if it's not compliant with its assigned policies. Permissions for Remote Help app can include privilege elevation, viewing screen, take full control, take unattended control, and offer remote assistance, these permissions would be set by Intune RBAC permissions. 

Customer Responsibility
•	Prohibiting remote activation for any collaborative computing devices within or controlled from customer-deployed resources and defining exceptions where remote activation is allowed (if any).`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.13',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Manage and control Mobile code that can run on multiple systems such as customer-developed mobile code, Java, Flash, ActiveX, PDF, Shockwave, Postscript, VBScripts via policies to allow only trusted sites. One option is to block the execution of mobile code in the browser but grant the user the liberty to allow mobile code to run. This can be accomplished via group policy settings. Granting users the ability to allow mobile code does expose them to more threats however training users on mobile code threats can help reduce this risk. If you have plenty of IT staff then only allowing mobile code when there is a business need is the best approach. This should be done in line with your change control procedures.

Microsoft Defender protection may be deployed based on the needs of application workloads, with either basic secure-by-default or advanced custom configuration, including antimalware monitoring. The solution can remediate threats such as malicious code as it scans for vulnerabilities. See code samples to enable and configure Microsoft Antimalware for Azure Resource Manager (ARM) virtual machines. 

Intune/Intune Suite can integrate data from a Mobile Threat Defense (MTD) vendor as an information source for device compliance policies and device Conditional Access rules. You can use this information to help protect corporate resources like Exchange and SharePoint, by blocking access from compromised mobile devices. Enforce compliance for Microsoft Defender for Endpoint with Conditional Access in Intune. You can integrate Microsoft Defender for Endpoint with Microsoft Intune as a Mobile Threat Defense solution. Integration can help you prevent security breaches and limit the impact of breaches within an organization. 

Help protect your web apps from malicious attacks and common web vulnerabilities, such as SQL injection and cross-site scripting. Configure and enable Azure Web Application Firewall on your web application. Then, centrally define your rules and reuse them across all the web apps that you need to protect.

While Microsoft Copilot for Security does not have the ability to control and manage the types of mobile code in an organization's system. Microsoft Copilot for Security works with Microsoft Defender which can be used to analyze scripts and codes, set policy and settings management, and troubleshoot devices. The script analysis capability with Microsoft Defender provides security teams added capacity to inspect scripts without using external tools. This capability also reduces complexity of analysis, minimizing challenges and allowing security teams to quickly assess and identify a script as malicious or benign. Script analysis is also available in the Copilot for Security standalone experience through the Microsoft Defender XDR plugin.

Customer Responsibility
•The customer is responsible for defining acceptable and unacceptable mobile code technologies.
•The customer is responsible for establishing usage restrictions and implementation guidance for acceptable mobile code and mobile code technologies.
•The customer is responsible for establishing usage restrictions and implementation guidance for acceptable mobile code and mobile code technologies.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.14',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `When a user of your application calls another user of your application over an internet or data connection for example via Teams/Teams Premium, the call is made over Voice Over IP (VoIP). In this case, both signaling and media flow over the internet. You can configure and monitor usage in Teams/Teams Premium.

Customer Responsibility
•	Authorizing, monitoring, and controlling the use of Voice Over Internet Protocol (VoIP) technologies within customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.15',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Azure Government provides the same ways to build applications and manage identities as Azure Public. Azure Government customers may already have an Microsoft Entra ID Public tenant or may create a tenant in Microsoft Entra ID Government. Integrating Applications with Microsoft Entra ID shows how you can use Microsoft Entra ID to provide secure sign-in and authorization to your applications. This process is the same for Azure Public and Azure Government once you choose your identity authority.

Users and groups can be enabled for Microsoft Entra Multifactor Authentication to prompt for additional verification during the sign-in event. Security defaults are available for all Microsoft Entra ID tenants to quickly enable the use of the Microsoft Authenticator app for all users.

For more granular controls, Conditional Access policies can be used to define events or applications that require MFA. These policies can allow regular sign-in events when the user is on the corporate network or a registered device, but prompt for additional verification factors when remote or on a personal device.

Improve the security of Windows virtual machines (VMs) in Azure by integrating with Microsoft Entra ID authentication. You can use Microsoft Entra ID as a core authentication platform to RDP into your VM. To use Microsoft Entra ID login in for Windows VM in Azure, you need to first enable Microsoft Entra ID login option for your Windows VM and then you need to configure Azure role assignments for users who are authorized to login in to the VM. You can centrally control and enforce Azure RBAC and Conditional Access policies that allow or deny access to the VMs. 

Authentication with Key Vault works in conjunction with Microsoft Entra ID, which is responsible for authenticating the identity of any given security principal. By default, Key Vault allows access to resources through public IP addresses. For greater security, you can also restrict access to specific IP ranges, service endpoints, virtual networks, or private endpoints. 

With Teams Premium, Teams admins can enable end-to-end meeting encryption for Teams meeting, ensuring that audio, video, and screen sharing features are encrypted. This feature is only available via Teams Premium. 

Customer Responsibility
•	Protecting the authenticity of communications sessions involving customer-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.16',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `The storage location of the encryption keys and access control to those keys is central to an encryption at rest model. The keys need to be highly secured but manageable by specified users and available to specific services. For Azure services, Azure Key Vault is the recommended key storage solution and provides a common management experience across services. Keys are stored and managed in key vaults, and access to a key vault can be given to users or services. Azure Key Vault supports customer creation of keys or import of customer keys for use in customer-managed encryption key scenarios. Permissions to use the keys stored in Azure Key Vault, either to manage or to access them for Encryption at Rest encryption and decryption, can be given to Microsoft Entra ID accounts.

Software as a Service (SaaS) customers typically have encryption at rest enabled or available in each service. Microsoft 365 has several options for customers to verify or enable encryption at rest.

Platform as a Service (PaaS) customer's data typically resides in a storage service such as Blob Storage but may also be cached or stored in the application execution environment, such as a virtual machine. 

Like PaaS, IaaS solutions can leverage other Azure services that store data encrypted at rest. In these cases, you can enable the Encryption at Rest support as provided by each consumed Azure service. The Data encryption models: supporting services table enumerates the major storage, services, and application platforms and the model of Encryption at Rest supported.

Customer Responsibility
•	Protecting customer-controlled information at rest.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.2',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Promote effective information security within your organizational systems by implementing secure security design principles. Microsoft recommendations for security design principles support these three key strategies (Security Strategy, Enterprise Segmentation Strategy and Account Control Strategy) and describe a securely architected system hosted on cloud or on-premises datacenters (or a combination of both). Application of these principles will dramatically increase the likelihood your security architecture will maintain assurances of confidentiality, integrity, and availability

Customer Responsibility
•monitoring and controlling communications at and within the boundaries of the CUSTOMER-deployed system. 
•implementing subnetworks for CUSTOMER-deployed resources to logically separate publicly accessible resources from internal resources. 
•restricting connections to external networks or systems through managed interfaces, consisting of boundary protection devices arranged in accordance with the CUSTOMER's security architecture.
•configuring all CUSTOMER-deployed resources to communicate through FIPS 140-2 validated encryption to protect the confidentiality and integrity of the information being transmitted.
•configuring their web browsers, mobile devices, etc., to enable communications through FIPS 140-2 validated encryption. CUSTOMER s who enforce FDCC/USGCB settings will achieve FIPS 140-2 encryption for data transmitted to Microsoft Azure, and between their enablers and the Azure web services interface; strong encryption with FIPS-approved ciphers is still possible if workstations are not operating in FIPS mode.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.3',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Microsoft Entra ID  offers a robust security set for enforcing the separation of user functionality from system management functionality. Best practice recommendation is to segregate duties within your team by setting up Role Based Access Control (RBAC) which will help you manage who has access to Azure resources. 

Microsoft Entra ID roles allow you to grant granular permissions to your admins, abiding by the principle of least privilege. Microsoft Entra ID built-in and custom roles operate on concepts similar to those you will find in the role-based access control system for Azure resources (Azure roles).

Ensure that the right users have the right access to the right resources by using intelligent cloud identity governance. Monitor and audit access to all resources while managing employee productivity.

Customer Responsibility
•Separating system functionality into two separate categories: user functionality and management functionality.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.4',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Azure Information Protection (AIP) is a cloud-based solution that enables organizations to discover, classify, and protect documents and emails by applying labels to content. AIP is part of the Microsoft Information Protection (MIP) solution, and extends the labeling and classification functionality provided by Microsoft 365. 

By default, built-in labeling is turned off in Office apps when the Azure Information Protection client is installed. Labels can be applied automatically by administrators who define rules and conditions, manually by users, or a combination where users are given recommendations. 

Microsoft Entra ID  offers a robust security set for preventing unauthorized and unintended information transfer via shared system resources. A good practice is to segregate duties within your team by setting up Role Based Access Control (RBAC) which will help you manage who has access to Azure resources. 

Ensure that the right users have the right access to the right resources by using intelligent cloud identity governance. Monitor and audit access to all resources while managing employee productivity.

Customer Responsibility
•preventing unauthorized and unintended information transfer between CUSTOMER-deployed resources.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.5',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Protect your subnet from potential threats by restricting access to it with a Network Security Group (NSG). NSGs contain a list of Access Control List (ACL) rules that allow or deny network traffic to your subnet.

A public load balancer can provide outbound connections for virtual machines (VMs) inside your virtual network. These connections are accomplished by translating their private IP addresses to public IP addresses. Public Load Balancers are used to load balance internet traffic to your VMs. An internal (or private) load balancer is used where private IPs are needed at the frontend only. Internal load balancers are used to load balance traffic inside a virtual network. A load balancer frontend can be accessed from an on-premises network in a hybrid scenario. Standard load balancers and standard public IP addresses are closed to inbound connections unless opened by Network Security Groups. NSGs are used to explicitly permit allowed traffic. If you do not have an NSG on a subnet or NIC of your virtual machine resource, traffic is not allowed to reach this resource.

Employ Remote Desktop Gateways services as the internal/external managed interface for interactive access to the infrastructure environment. Require encrypted connections for connectivity from any of the solutions used to access the environment remotely or from the corporate network.

Azure Bastion is a fully managed platform PaaS service from Azure that is hardened internally to provide you secure RDP/SSH connectivity. You do not need to apply any NSGs on Azure Bastion subnet. Because Azure Bastion connects to your virtual machines over private IP, you can configure your NSGs to allow RDP/SSH from Azure Bastion only. This removes the hassle of managing NSGs each time you need to securely connect to your virtual machines. Create an Azure Bastion host and connect to a Windows VM

Customer Responsibility: 
• Monitoring and controlling communications at and within the boundaries of the CUSTOMER-deployed system. 
• Implementing subnetworks for CUSTOMER -deployed resources to logically separate publicly accessible resources from internal resources. 
• Restricting connections to external networks or systems through managed interfaces, consisting of boundary protection devices arranged in accordance with the CUSTOMER 's security architecture.
• Configuring all CUSTOMER -deployed resources to communicate through FIPS 140-2 validated encryption to protect the confidentiality and integrity of the information being transmitted.
• Configuring their web browsers, mobile devices, etc., to enable communications through FIPS 140-2 validated encryption. CUSTOMER’s who enforce FDCC/USGCB settings will achieve FIPS 140-2 encryption for data transmitted to Microsoft Azure, and between their enablers and the Azure web services interface; strong encryption with FIPS-approved ciphers is still possible if workstations are not operating in FIPS mode.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.6',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `You can configure NAT rules, network rules, and applications rules on Azure Firewall. The rules are processed according to the rule type and traffic is dropped by default if it is not permitted.

Outbound: If you configure network rules and application rules, then network rules are applied in priority order before application rules. The rules are terminating. Such that if a match is found in a network rule, no other rules are processed. If there is no network rule match, and if the protocol is HTTP, HTTPS, or MSSQL, then the packet is then evaluated by the application rules in priority order. If still no match is found, then the packet is evaluated against the infrastructure rule collection. If there is still no match, then the packet is denied by default.

Inbound Internet connectivity can be enabled by configuring Destination Network Address Translation (DNAT) as described in Tutorial: Filter inbound traffic with Azure Firewall DNAT using the Azure portal. NAT rules are applied in priority before network rules. If a match is found, an implicit corresponding network rule to allow the translated traffic is added. For security reasons, the recommended approach is to add a specific internet source to allow DNAT access to the network and avoid using wildcards. 

Application rules are not applied for inbound connections. So if you want to filter inbound HTTP/S traffic, you should use a Web Application Firewall (WAF). 

Customer Responsibility
•	Configuring managed network interfaces to deny all traffic by default and permit by exception.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.7',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Host information and services in cloud environments such as Microsoft Government Community Cloud – High (GCCH) Office 365 (O365) tenant to remove the need for remote user VPN. Since GCCH O365 tenant is considered a part of a system and internal, you can leverage all of the benefits of the O365 cloud without the headaches of having on-premises servers. This will eliminate split tunnel connections. This solution may not work for some companies that require on-premises systems. ExpressRoute is designed to link on-prem and Azure securely. Explore using Azure ExpressRoute to create private connections between Azure datacenters and infrastructure on your premises or in a colocation environment. ExpressRoute connection restricts public internet providing a private connection to Azure. 

Forced tunneling lets you redirect or “force” all Internet-bound traffic back to your on-premises location via a Site-to-Site VPN tunnel for inspection and auditing. This is a critical security requirement for most enterprise IT policies. Without forced tunneling, Internet-bound traffic from your VMs in Azure always traverses from Azure network infrastructure directly out to the Internet, without the option to allow you to inspect or audit the traffic. Unauthorized Internet access can potentially lead to information disclosure or other types of security breaches

Customer Responsibility
•Preventing split tunneling for remote devices connecting to the CUSTOMER-deployed system.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SC.L2-3.13.8',
    inheritance_type: 'validation_required',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    practice_id: 'SC.L2-3.13.9',
    inheritance_type: 'full',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Implement automatic user session re-evaluation with Microsoft Entra ID features such as Risk-Based Conditional Access and Continuous Access Evaluation. Inactivity conditions can be implemented at a device level as described in:
•	Sign-in risk-based Conditional Access
•	User risk-based Conditional Access
•	Continuous Access Evaluation

Additionally, having a lockout threshold limiting the number of unsuccessful login attempts will protect against threats such as, Brute Force Attacks by automatically locking the account after a specified number of attempts. Default lockout threshold is set to 10 failed sign-ins before the first lockout occurs. It is important to customize the lockout threshold to fit your business requirements using Microsoft Entra ID smart lockout . 

Customer Responsibility
•implementing a network disconnect for CUSTOMER-deployed resources at the end of a communication session or after a CUSTOMER-defined time period of inactivity.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SI.L2-3.14.2',
    inheritance_type: 'validation_required',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Help protect your web apps from malicious attacks and common web vulnerabilities, such as SQL injection and cross-site scripting. Configure and enable Azure Web Application Firewall on your web application. Then, centrally define your rules and reuse them across all the web apps that you need to protect. 

Microsoft Antimalware for Azure is a single-agent solution for applications and tenant environments, designed to run in the background without human intervention. Protection may be deployed based on the needs of application workloads, with either basic secure-by-default or advanced custom configuration, including antimalware monitoring. The solution can remediate threats such as malicious code as it scans for vulnerabilities. 

When you integrate Intune with Microsoft Defender for Endpoint, you can take advantage of Microsoft Defender for Endpoints Threat & Vulnerability Management (TVM) and use Intune to remediate endpoint weakness identified by TVM. Integration can help you prevent security breaches and limit the impact of breaches within an organization. Turn tamper protection on (or off) for all or part of your organization using Intune/Intune Suite Fine-tune tamper protection settings in your organization. Manage tamper protection for your organization using Intune/Intune Suite. Bad actors like to disable your security features to get easier access to your data, to install malware, or to otherwise exploit your data, identity, and devices.

Customer Responsibility: 
• Protecting customer-deployed resources against malicious code by using code protection mechanisms at entry and exit points to detect and eradicate malicious code (e.g., viruses, malware, rootkits, worms, and scripts).`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SI.L2-3.14.3',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `No Microsoft Coverage.

Customer Responsibility
•	Receiving security alerts, advisories, and directives from customer-defined external organizations on an ongoing basis`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SI.L2-3.14.4',
    inheritance_type: 'partial',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Software updates in Azure Automation Update Management provides a set of tools and resources that can help manage the complex task of tracking and applying software updates to machines in Azure and hybrid cloud. An effective software update management process is necessary to maintain operational efficiency, overcome security issues, and reduce the risks of increased cyber security threats. Update Management supports the deployment of first-party updates and the pre-downloading of them. This support requires changes on the systems being updated. 

Customer Responsibility:
• Updating malicious code protection mechanisms when new releases are available in accordance with organizational configuration management policy and procedures.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
  {
    practice_id: 'SI.L2-3.14.6',
    inheritance_type: 'validation_required',
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
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
    source_title: 'Azure Government — Product Placemat for CMMC',
    source_url: 'https://aka.ms/cmmc/productplacemat',
    rationale: 'Azure Government — Product Placemat for CMMC',
    customer_actions: `Connect your sources such as, Microsoft Defender for Endpoint to Sentinel for monitoring your organization. Enable Fusion technology based on machine learning, allowing Microsoft Sentinel to automatically detect multistage attacks by identifying combinations of anomalous behaviors and suspicious activities that are observed at various stages of the kill-chain. Based on these discoveries, Microsoft Sentinel generates incidents that would otherwise be difficult to catch. Customized for your environment, this detection technology not only reduces false positive rates but can also detect attacks with limited or missing information.

Microsoft Copilot for Security can access data from Microsoft Sentinel to increase the effectiveness and efficiency of security professionals using those solutions. Microsoft Defender XDR and Microsoft Sentinel become even more powerful when security professionals use Copilot for Security. Copilot for Security delivers an experience that enriches and builds on the security data, signals, and existing incidents and insights sourced from Microsoft Defender XDR and Microsoft Sentinel.

Customer Responsibility
•Monitoring customer-deployed resources to identify unauthorized use through customer-defined techniques and methods.`,
    notes: 'Sourced from Microsoft Product Placemat for CMMC (https://aka.ms/cmmc/productplacemat).',
  },
]
